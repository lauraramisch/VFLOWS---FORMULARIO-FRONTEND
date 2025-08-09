// FUNÇÕES DE MÁSCARAS
function mascaraCNPJ(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    return valor;
}

function mascaraCEP(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    return valor;
}

function mascaraTELEFONE(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
    return valor;
}

// APLICANDO AS MÁSCARAS
document.querySelector('input[name="cnpj"]').addEventListener('input', function () {
    this.value = mascaraCNPJ(this.value);
});

document.getElementById('cep').addEventListener('input', function () {
    this.value = mascaraCEP(this.value);
});

document.querySelector('input[name="telefone"]').addEventListener('input', function () {
    this.value = mascaraTELEFONE(this.value);
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
                } else {
                    alert("CEP NÃO ENCONTRADO!");
                }
            })
            .catch(() => alert('ERRO AO BUSCAR CEP!'));
    } else {
        alert("CEP INVÁLIDO!");
    }
});

// ============================ PRODUTOS ============================
const produtosBody = document.getElementById('produtosBody');
const btnAddProduto = document.getElementById('btnAddProduto');
const inputAnexos = document.getElementById('inputAnexos');
const listaAnexos = document.getElementById('listaAnexos');
const modalLoading = new bootstrap.Modal(document.getElementById('modalLoading'));

let anexosEmMemoria = {}; // chave: nome arquivo, valor: Blob

// FUNÇÃO PARA CRIAR LINHA DE PRODUTO
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
        anexosEmMemoria[arquivo.name] = arquivo;
    }
    atualizarListaAnexos();
    inputAnexos.value = ''; // limpa input
});

// ============================ SUBMIT FORM ============================
document.getElementById('formCadastro').addEventListener('submit', function (e) {
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
        const qtd = tr.querySelector('.quantidade').value;
        const valorUnitario = tr.querySelector('.valorUnitario').value;

        if (!descricao || !unidade || !qtd || !valorUnitario) {
            alert("Preencha todos os campos obrigatórios dos produtos!");
            return;
        }
    }

    // VALIDAR PELO MENOS UM ANEXO
    if (Object.keys(anexosEmMemoria).length === 0) {
        alert('Inclua pelo menos um documento anexado.');
        return;
    }

    // MONTAR JSON
    const produtos = Array.from(produtosBody.children).map(tr => ({
        descricao: tr.querySelector('.descricao').value.trim(),
        unidadeMedida: tr.querySelector('.unidade').value.trim(),
        quantidadeEstoque: Number(tr.querySelector('.quantidade').value),
        valorUnitario: Number(tr.querySelector('.valorUnitario').value),
        valorTotal: Number(tr.querySelector('.valorTotal').value),
    }));

    const anexos = Object.entries(anexosEmMemoria).map(([nome, blob]) => ({
        nome,
        tamanho: blob.size,
        tipo: blob.type,
    }));

    const dados = { produtos, anexos };

    console.log('JSON de envio:', dados);

    // MOSTRAR MODAL LOADING
    modalLoading.show();

    // SIMULAR ENVIO
    setTimeout(() => {
        modalLoading.hide();
        alert("Dados enviados com sucesso! Veja o console para o JSON.");
    }, 2000);
});
