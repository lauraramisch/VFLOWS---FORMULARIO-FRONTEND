// FUNÇÕES DE MÁSCARA
function mascaraCNPJ(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    return valor;
}

// FUNÇÃO PARA EXIBIR ERRO SEM TRAVAR A INTERFACE
function mostrarErro(elementoId, mensagem) {
    const errorDiv = document.getElementById(elementoId + '-error');
    const input = document.getElementById(elementoId);
    
    if (errorDiv && input) {
        errorDiv.textContent = mensagem;
        errorDiv.style.display = 'block';
        input.classList.add('is-invalid');
        
        // Remove o erro após alguns segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
            input.classList.remove('is-invalid');
        }, 5000);
    }
}

function limparErro(elementoId) {
    const errorDiv = document.getElementById(elementoId + '-error');
    const input = document.getElementById(elementoId);
    
    if (errorDiv && input) {
        errorDiv.style.display = 'none';
        input.classList.remove('is-invalid');
    }
}

function mascaraCEP(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    return valor;
}

function mascaraTelefone(valor) {
    valor = valor.replace(/\D/g, "");
    if (valor.length > 10) {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{4}).*/, "($1) $2-$3");
    }
    return valor;
}


// APLICANDO AS MÁSCARAS

/*============================ CNPJ ============================ */
document.getElementById('cnpj').addEventListener('input', function() {
    const digitos = this.value.replace(/\D/g, '').slice(0, 14);
    this.value = mascaraCNPJ(digitos);
    
    if (digitos.length > 0) {
        limparErro('cnpj');
    }
});

document.getElementById('cnpj').addEventListener('paste', function(e) {
    e.preventDefault();
    const digitos = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 14);
    this.value = mascaraCNPJ(digitos);
});

document.getElementById('cnpj').addEventListener('blur', function() {
    const digitos = this.value.replace(/\D/g, '');
    if (digitos.length > 0 && digitos.length !== 14) {
        mostrarErro('cnpj', 'CNPJ incompleto! São necessários 14 dígitos.');
    }
});

/* ============================CEP ============================ */
document.getElementById('cep').addEventListener('input', function() {
    const digitos = this.value.replace(/\D/g, '').slice(0, 8);
    this.value = mascaraCEP(digitos);
    
    if (digitos.length > 0) {
        limparErro('cep');
    }
});

document.getElementById('cep').addEventListener('paste', function(e) {
    e.preventDefault();
    const digitos = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 8);
    this.value = mascaraCEP(digitos);
});

/* ============================ TELEFONE ============================ */
document.getElementById('telefone').addEventListener('input', function() {
    const digitos = this.value.replace(/\D/g, '').slice(0, 11); // DDD + 9 dígitos
    this.value = mascaraTelefone(digitos);
    
    if (digitos.length > 0) {
        limparErro('telefone');
    }
});

document.getElementById('telefone').addEventListener('paste', function(e) {
    e.preventDefault();
    const digitos = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 11);
    this.value = mascaraTelefone(digitos);
});

document.getElementById('telefone').addEventListener('blur', function() {
    const digitos = this.value.replace(/\D/g, '');
    if (digitos.length > 0 && digitos.length < 10) {
        mostrarErro('telefone', 'Telefone incompleto! Formato esperado: (XX) 9XXXX-XXXX');
    }
});

// BUSCA ENDEREÇO PELO CEP
document.getElementById('cep').addEventListener('blur', function () {
    let cep = this.value.replace(/\D/g, '');
    if (cep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(res => res.json())
            .then(data => {
                                 if (!data.erro) {
                    document.getElementById('endereco').value =
                        `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
                    limparErro('cep');
                } else {
                    mostrarErro('cep', 'CEP NÃO ENCONTRADO!');
                }
            })
            .catch(() => {
                mostrarErro('cep', 'ERRO AO BUSCAR CEP!');
            });
    } else if (cep.length > 0) {
        mostrarErro('cep', 'CEP INVÁLIDO! Digite 8 dígitos.');
    }
});

// ============================ PRODUTOS ============================
const produtosBody = document.getElementById('produtosBody');
const btnAddProduto = document.getElementById('btnAddProduto');
const inputAnexos = document.getElementById('inputAnexos');
const listaAnexos = document.getElementById('listaAnexos');
const modalLoading = new bootstrap.Modal(document.getElementById('modalLoading'));

let anexosEmMemoria = {}; 

function criarLinhaProduto() {
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td><input type="text" class="form-control descricao" required></td>
        <td><input type="text" class="form-control unidade" required></td>
        <td><input type="number" class="form-control quantidade" min="1" required></td>
        <td><input type="number" class="form-control valorUnitario" min="0" step="0.01" required></td>
        <td><input type="text" class="form-control valorTotal" readonly></td>
        <td>
            <button type="button" class="btn btn-danger btn-sm btnExcluirProduto">🗑️</button>
        </td>
    `;

    // ATUALIZA O VALOR TOTAL AO MUDAR QUANTIDADE OU VALOR UNITÁRIO
    tr.querySelector('.quantidade').addEventListener('input', atualizarValorTotal);
    tr.querySelector('.valorUnitario').addEventListener('input', atualizarValorTotal);

    // EXCLUIR LINHA
    tr.querySelector('.btnExcluirProduto').addEventListener('click', () => {
        tr.remove();
    });

    function atualizarValorTotal() {
        const qtd = parseFloat(tr.querySelector('.quantidade').value) || 0;
        const valor = parseFloat(tr.querySelector('.valorUnitario').value) || 0;
        const total = (qtd * valor).toFixed(2);
        tr.querySelector('.valorTotal').value = total;
    }

    produtosBody.appendChild(tr);
}

criarLinhaProduto();
btnAddProduto.addEventListener('click', criarLinhaProduto);

// ============================ ANEXOS ============================

const TIPOS_PERMITIDOS =[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE_MB = 5; // LIMITANDO OS MB

function atualizarListaAnexos() {
    listaAnexos.innerHTML = '';
    Object.keys(anexosEmMemoria).forEach(nome => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = nome;

        const btns = document.createElement('div');

        // BOTÃO VISUALIZAR
        const btnVisualizar = document.createElement('button');
        btnVisualizar.className = 'btn btn-primary btn-sm me-2';
        btnVisualizar.textContent = '👁️';
        btnVisualizar.addEventListener('click', () => {
            const blob = anexosEmMemoria[nome];
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nome;
            a.click();
            URL.revokeObjectURL(url);
        });

        // BOTÃO EXCLUIR
        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'btn btn-danger btn-sm';
        btnExcluir.textContent = '🗑️';
        btnExcluir.addEventListener('click', () => {
            delete anexosEmMemoria[nome];
            atualizarListaAnexos();
        });

        btns.appendChild(btnVisualizar);
        btns.appendChild(btnExcluir);
        li.appendChild(btns);
        listaAnexos.appendChild(li);
    });
}

inputAnexos.addEventListener('change', () => {
    const arquivos = inputAnexos.files;
    for (const arquivo of arquivos) {
        const tipoValido = TIPOS_PERMITIDOS.includes(arquivo.type);
        const tamanhoMB = arquivo.size /(1024 *1024);

        if(!tipoValido){
            alert(`O ARQUIVO "${arquivo.name}" NÃO É DE UM TIPO PERMITIDO.`);
            continue;
        }

        if(tamanhoMB > MAX_FILE_SIZE_MB){
            alert(`O ARQUIVO "${arquivo.name}" EXCEDE O LIMITE DE ${MAX_FILE_SIZE_MB} MB!`)
            continue;
        }

        anexosEmMemoria[arquivo.name] = arquivo;
    }

    atualizarListaAnexos();
    inputAnexos.value = ''; // limpa input
});

// ============================ SUBMIT FORM ============================
document.getElementById('formProduto').addEventListener('submit', function (e) {
    e.preventDefault();

    // VALIDAR PELO MENOS UM PRODUTO
    if (produtosBody.children.length === 0) {
        alert('Inclua pelo menos um produto!');
        return;
    }

    // VALIDAR PRODUTOS
    for (const tr of produtosBody.children) {
        const descricao = tr.querySelector('.descricao').value.trim();
        const unidade = tr.querySelector('.unidade').value.trim();
        const qtd = tr.querySelector('.quantidade').value.trim();
        const valorUnitario = tr.querySelector('.valorUnitario').value.trim();

        if (!descricao || !unidade || !qtd || !valorUnitario) {
            alert("Preencha todos os campos obrigatórios dos produtos!");
            return;
        }

        if (isNaN(qtd) || isNaN(valorUnitario)){
            alert("Quantidade e Valor Unitário devem ser válidos.");
            return;
        }
    }

    // VALIDAR PELO MENOS UM ANEXO
    if (Object.keys(anexosEmMemoria).length === 0) {
        alert('Inclua pelo menos um documento anexado.');
        return;
    }

    // PEGA FORM CADASTRO
    const dadosEmpresa = {
        razaosocial: document.getElementById('razaosocial').value.trim(),
        nomefantasia: document.getElementById('nomefantasia').value.trim(),
        cnpj: document.getElementById('cnpj').value.trim(),
        inscricaoestadual: document.getElementById('inscricaoestadual').value.trim(),
        inscricaomunicipal: document.getElementById('inscricaomunicipal').value.trim(),
        cep: document.getElementById('cep').value.trim(),
        endereco: document.getElementById('endereco').value.trim(),
        nomedapessoadecontato: document.getElementById('nomedapessoadecontato').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim()
    };

    // MONTAR JSON
    const produtos = Array.from(produtosBody.children).map(tr => {
        const quantidadeEstoque = Number(tr.querySelector('.quantidade').value);
        const valorUnitario = Number(tr.querySelector('.valorUnitario').value);
        const valorTotal = quantidadeEstoque * valorUnitario;
        return {
            descricao: tr.querySelector('.descricao').value.trim(),
            unidadeMedida: tr.querySelector('.unidade').value.trim(),
            quantidadeEstoque,
            valorUnitario,
            valorTotal,
        };
    });
    const anexos = Object.entries(anexosEmMemoria).map(([nome, blob]) => ({
        nome,
        tamanho: blob.size,
        tipo: blob.type,
    }));

    const dados = { dadosEmpresa, produtos, anexos };

    console.log('JSON de envio:', dados);

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dadosEmpresa.razaosocial.replace(/\s/g, '_')}_dados.json`;   
    a.click();
    URL.revokeObjectURL(url);

    // MOSTRAR MODAL LOADING
    modalLoading.show();

    // SIMULAR ENVIO
    setTimeout(() => {
        modalLoading.hide();
        alert("Dados enviados com sucesso! Veja o console para o JSON.");
    }, 2000);
});
