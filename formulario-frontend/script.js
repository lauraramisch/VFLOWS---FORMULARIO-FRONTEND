// FUNÇÕES DE MÁSCARA
/**
 * Função que aplica máscara de formatação para CNPJ
 * Converte entrada numérica para o formato XX.XXX.XXX/XXXX-XX
 * @param {string} valor - String contendo números do CNPJ
 * @return {string}
 * 
function mascaraCNPJ(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    return valor;
}


      
 * @param {string} elementoId 
 * @param {string} mensagem 
 */
function mostrarErro(elementoId, mensagem) {
    const errorDiv = document.getElementById(elementoId + '-error');
    const input = document.getElementById(elementoId);
    
    if (errorDiv && input) {
        errorDiv.textContent = mensagem;
        errorDiv.style.display = 'block';
        input.classList.add('is-invalid');
        
        // Adiciona evento de input para remover validação quando usuário digita
        input.addEventListener('input', () => {
            errorDiv.style.display = 'none';
            input.classList.remove('is-invalid');
            input.classList.remove('campo-obrigatorio');
        }, { once: true });
        
        // Adiciona evento de focus para remover a animação quando o usuário clica no campo
        input.addEventListener('focus', () => {
            input.classList.remove('campo-obrigatorio');
        }, { once: true });
        
        // Remove o erro após alguns segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
            input.classList.remove('is-invalid');
        }, 5000);
    }
}

/**
 * Remove mensagem de erro de um campo específico
 * @param {string} elementoId - ID do elemento a limpar erro
 */
function limparErro(elementoId) {
    const errorDiv = document.getElementById(elementoId + '-error');
    const input = document.getElementById(elementoId);
    
    if (errorDiv && input) {
        errorDiv.style.display = 'none';
        input.classList.remove('is-invalid');
    }
}

/**
 * Função que aplica máscara de formatação para CEP
 * Converte entrada numérica para o formato XXXXX-XXX
 * @param {string} valor - String contendo números do CEP
 * @return {string} CEP formatado
 */
function mascaraCEP(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    return valor;
}

/**
 * Função que aplica máscara de formatação para telefone
 * Adapta-se ao tamanho da entrada para formatar corretamente
 * @param {string} valor - String contendo números do telefone
 * @return {string} Telefone formatado
 */
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
/**
 * Evento de input para o campo CNPJ
 * Aplica máscara de formatação e consulta CNPJ quando completo
 */
document.getElementById('cnpj').addEventListener('input', function() {
    const digitos = this.value.replace(/\D/g, '').slice(0, 14);
    this.value = mascaraCNPJ(digitos);
    
    if (digitos.length > 0) {
        limparErro('cnpj');
    }
    
    // Buscar dados automaticamente quando completar 14 dígitos
    if (digitos.length === 14) {
        consultarCNPJ(digitos);
    }
});

/**
 * Função para consultar CNPJ na API Brasil
 * Busca e preenche automaticamente os dados da empresa
 * @param {string} digitos - CNPJ sem formatação (apenas números)
 */
function consultarCNPJ(digitos) {
    // Mostrar modal de carregamento durante a consulta
    const loadingSpinner = document.getElementById('loadingSpinner');
    const modalMessage = document.getElementById('modalMessage');
    const btnCloseModal = document.getElementById('btnCloseModal');
    
    loadingSpinner.style.display = 'inline-block';
    modalMessage.textContent = 'Consultando dados do CNPJ...';
    btnCloseModal.style.display = 'none';
    modalLoading.show();
    
    // Consultar API Brasil para obter dados da empresa
    fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }
            return response.json();
        })
        .then(data => {
            // Preencher os campos com os dados retornados
            document.getElementById('razaosocial').value = data.razao_social || '';
            document.getElementById('nomefantasia').value = data.nome_fantasia || '';
            
            // Montar o endereço completo
            const logradouro = data.logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}` : '';
            const numero = data.numero || '';
            const complemento = data.complemento ? `, ${data.complemento}` : '';
            const bairro = data.bairro ? `, ${data.bairro}` : '';
            const municipio = data.municipio ? `, ${data.municipio}` : '';
            const uf = data.uf ? ` - ${data.uf}` : '';
            
            document.getElementById('endereco').value = `${logradouro}${numero ? ', ' + numero : ''}${complemento}${bairro}${municipio}${uf}`;
            
            // Preencher CEP se disponível
            if (data.cep) {
                const cepFormatado = data.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
                document.getElementById('cep').value = cepFormatado;
            }
            
            // Preencher apenas o telefone da empresa se disponível
            if (data.ddd_telefone_1) {
                const telefone = data.ddd_telefone_1.toString();
                document.getElementById('telefone').value = mascaraTelefone(telefone);
                // O telefone da pessoa de contato deve ser preenchido manualmente
            }
            
            limparErro('cnpj');
            
            setTimeout(() => {
                modalLoading.hide();
            }, 500);
        })
        .catch(error => {
            console.error('Erro ao consultar CNPJ:', error);
            mostrarErro('cnpj', 'CNPJ não encontrado ou serviço indisponível.');
            modalLoading.hide();
        });
}

/**
 * Evento de colar (paste) para o campo CNPJ
 * Formata o CNPJ colado e inicia consulta automática se completo
 */
document.getElementById('cnpj').addEventListener('paste', function(e) {
    e.preventDefault();
    const digitos = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 14);
    this.value = mascaraCNPJ(digitos);
    
    // Consultar CNPJ automaticamente após colar, se tiver 14 dígitos
    if (digitos.length === 14) {
        // Pequeno atraso para garantir que o valor foi atualizado na interface
        setTimeout(() => {
            consultarCNPJ(digitos);
        }, 100);
    }
});

/**
 * Evento de perda de foco (blur) para o campo CNPJ
 * Valida se o CNPJ está completo quando o usuário sai do campo
 */
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

/* ============================ TELEFONES ============================ */
// IMPLEMENTAÇÃO: Adicionada validação para telefone da pessoa de contato
document.getElementById('telefonecontato').addEventListener('input', function() {
    const digitos = this.value.replace(/\D/g, '').slice(0, 11); // DDD + 9 dígitos
    this.value = mascaraTelefone(digitos);
    
    if (digitos.length > 0) {
        limparErro('telefonecontato');
    }
});

document.getElementById('telefonecontato').addEventListener('paste', function(e) {
    e.preventDefault();
    const digitos = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 11);
    this.value = mascaraTelefone(digitos);
});

document.getElementById('telefonecontato').addEventListener('blur', function() {
    const digitos = this.value.replace(/\D/g, '');
    if (digitos.length > 0 && digitos.length < 10) {
        mostrarErro('telefonecontato', 'Telefone incompleto! Formato esperado: (XX) 9XXXX-XXXX');
    }
});

/* ============================ TELEFONE EMPRESA ============================ */
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

/**
 * Validação do campo CEP quando o usuário sai do campo
 * Verifica se o CEP está completo com 8 dígitos
 */
document.getElementById('cep').addEventListener('blur', function () {
    let cep = this.value.replace(/\D/g, '');
    if (cep.length > 0 && cep.length !== 8) {
        mostrarErro('cep', 'CEP INVÁLIDO! Digite 8 dígitos.');
    } else {
        limparErro('cep');
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

    tr.querySelector('.quantidade').addEventListener('input', atualizarValorTotal);
    tr.querySelector('.valorUnitario').addEventListener('input', atualizarValorTotal);

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

const TIPOS_PERMITIDOS = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];


const ASSINATURAS_MAGICAS = {
    // PDF: %PDF
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    // DOC: D0CF11E0
    'application/msword': [0xD0, 0xCF, 0x11, 0xE0],
    // DOCX: PK (arquivos ZIP, que incluem DOCX)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04]
};

// Tamanho máximo permitido para arquivos em MB
const MAX_FILE_SIZE_MB = 5;

/**
  @param {File} arquivo 
  @return {Promise<boolean>} 
 */
async function verificarAssinaturaMagica(arquivo) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            const assinaturaEsperada = ASSINATURAS_MAGICAS[arquivo.type];
            
            if (!assinaturaEsperada) {
                resolve(false);
                return;
            }
            
            for (let i = 0; i < assinaturaEsperada.length; i++) {
                if (uint8Array[i] !== assinaturaEsperada[i]) {
                    resolve(false);
                    return;
                }
            }
            
            resolve(true);
        };
        
        const slice = arquivo.slice(0, 8);
        reader.readAsArrayBuffer(slice);
    });
}


function atualizarListaAnexos() {
    listaAnexos.innerHTML = '';
    Object.keys(anexosEmMemoria).forEach(nome => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = nome;

        const btns = document.createElement('div');

        // Botão para visualizar o anexo
        const btnVisualizar = document.createElement('button');
        btnVisualizar.className = 'btn btn-primary btn-sm me-2';
        btnVisualizar.textContent = '👁️';
        btnVisualizar.addEventListener('click', (e) => {
            // Evitar propagação do evento para não acionar outros eventos
            e.stopPropagation();
            e.preventDefault();
            
            // Abrir/baixar o arquivo diretamente
            const blob = anexosEmMemoria[nome];
            const url = URL.createObjectURL(blob);
            
            // Forçar download para todos os tipos de arquivo
            const a = document.createElement('a');
            a.href = url;
            a.download = nome;
            a.click();
            URL.revokeObjectURL(url);
            
            // Importante: Impedir que o evento continue e acione a validação do formulário
            return false;
        });

        // Botão para excluir o anexo
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

inputAnexos.addEventListener('change', async () => {
    const arquivos = inputAnexos.files;
    
    // Preparar variáveis para possível exibição de erro
    const loadingSpinner = document.getElementById('loadingSpinner');
    const modalMessage = document.getElementById('modalMessage');
    const btnCloseModal = document.getElementById('btnCloseModal');
    
    let arquivosValidos = true;
    let mensagemErro = '';
    
    for (const arquivo of arquivos) {
        const tipoValido = TIPOS_PERMITIDOS.includes(arquivo.type);
        const tamanhoMB = arquivo.size / (1024 * 1024);

        if (!tipoValido) {
            arquivosValidos = false;
            mensagemErro = `O ARQUIVO "${arquivo.name}" NÃO É DE UM TIPO PERMITIDO.`;
            break;
        }

        if (tamanhoMB > MAX_FILE_SIZE_MB) {
            arquivosValidos = false;
            mensagemErro = `O ARQUIVO "${arquivo.name}" EXCEDE O LIMITE DE ${MAX_FILE_SIZE_MB} MB!`;
            break;
        }
        
        const assinaturaValida = await verificarAssinaturaMagica(arquivo);
        if (!assinaturaValida) {
            arquivosValidos = false;
            mensagemErro = `O ARQUIVO "${arquivo.name}" PARECE TER SIDO RENOMEADO OU ESTÁ CORROMPIDO. A ASSINATURA DO ARQUIVO NÃO CORRESPONDE AO TIPO DECLARADO.`;
            break;
        }

        anexosEmMemoria[arquivo.name] = arquivo;
    }

    // Mostrar modal APENAS em caso de erro
    if (!arquivosValidos) {
        loadingSpinner.style.display = 'none';
        modalMessage.textContent = mensagemErro;
        btnCloseModal.style.display = 'inline-block';
        modalLoading.show();
    }

    atualizarListaAnexos();
    inputAnexos.value = ''; 
});

// ============================ SUBMIT FORM ============================

document.getElementById('formProduto').addEventListener('submit', function (e) {
    e.preventDefault();
    
    if (validarFormularioCompleto(true)) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const modalMessage = document.getElementById('modalMessage');
        const btnCloseModal = document.getElementById('btnCloseModal');
        
        loadingSpinner.style.display = 'inline-block';
        modalMessage.textContent = 'Enviando dados...';
        btnCloseModal.style.display = 'none';
        modalLoading.show();
        
        gerarEBaixarJSON();

        // SIMULAR ENVIO
        setTimeout(() => {
            loadingSpinner.style.display = 'none';
            modalMessage.textContent = 'Dados enviados com sucesso! O JSON foi baixado automaticamente.';
            btnCloseModal.style.display = 'inline-block';
        }, 2000);
    }
});

/**

  @param {boolean} mostrarModal 
  @return {boolean} 
 */
function validarFormularioCompleto(mostrarModal = true) {
    const camposFaltantes = [];
    
    const camposEmpresa = [
        'razaosocial', 'nomefantasia', 'cnpj', 'inscricaoestadual', 
        'inscricaomunicipal', 'cep', 'endereco', 'nomedapessoadecontato', 
        'telefonecontato', 'telefone', 'email'
    ];
    
    for (const campo of camposEmpresa) {
        const elemento = document.getElementById(campo) || 
                        document.querySelector(`[name="${campo}"]`);
        if (!elemento || !elemento.value.trim()) {
            let nomeCampo = campo.replace(/([A-Z])/g, ' $1').toLowerCase();
            const mapeamentoCampos = {
                'inscricaoestadual': 'Inscrição Estadual',
                'inscricaomunicipal': 'Inscrição Municipal',
                'nomedapessoadecontato': 'Nome da Pessoa de Contato',
                'telefonecontato': 'Telefone Contato',
                'email': 'E-mail',
                'telefone': 'Telefone',
                'razaosocial': 'Razão Social',
                'nomefantasia': 'Nome Fantasia',
                'cnpj': 'CNPJ',
                'cep': 'CEP',
                'endereco': 'Endereço'
            };
            nomeCampo = mapeamentoCampos[campo] || nomeCampo.charAt(0).toUpperCase() + nomeCampo.slice(1);
            camposFaltantes.push(nomeCampo);
            if (elemento) {
                elemento.classList.add('is-invalid');
                elemento.classList.add('campo-obrigatorio');
            }
        } else {
            if (elemento) {
                elemento.classList.remove('is-invalid');
                elemento.classList.remove('campo-obrigatorio');
            }
        }
    }
    
    // Verifica se existe pelo menos um produto
    if (produtosBody.children.length === 0) {
        camposFaltantes.push('Pelo menos um produto');
    }

    // Validação dos produtos existentes
    let produtosInvalidos = false;
    let valoresInvalidos = false;
    
    // Verifica cada linha de produto
    for (const tr of produtosBody.children) {
        const descricao = tr.querySelector('.descricao');
        const unidade = tr.querySelector('.unidade');
        const qtd = tr.querySelector('.quantidade');
        const valorUnitario = tr.querySelector('.valorUnitario');

        if (!descricao.value.trim() || !unidade.value.trim() || !qtd.value.trim() || !valorUnitario.value.trim()) {
            produtosInvalidos = true;
            if (!descricao.value.trim()) {
                descricao.classList.add('is-invalid');
                descricao.classList.add('campo-obrigatorio');
            }
            if (!unidade.value.trim()) {
                unidade.classList.add('is-invalid');
                unidade.classList.add('campo-obrigatorio');
            }
            if (!qtd.value.trim()) {
                qtd.classList.add('is-invalid');
                qtd.classList.add('campo-obrigatorio');
            }
            if (!valorUnitario.value.trim()) {
                valorUnitario.classList.add('is-invalid');
                valorUnitario.classList.add('campo-obrigatorio');
            }
        } else {
            descricao.classList.remove('is-invalid');
            descricao.classList.remove('campo-obrigatorio');
            unidade.classList.remove('is-invalid');
            unidade.classList.remove('campo-obrigatorio');
            qtd.classList.remove('is-invalid');
            qtd.classList.remove('campo-obrigatorio');
            valorUnitario.classList.remove('is-invalid');
            valorUnitario.classList.remove('campo-obrigatorio');
        }

        if (isNaN(qtd.value) || isNaN(valorUnitario.value)){
            valoresInvalidos = true;
            if (isNaN(qtd.value)) {
                qtd.classList.add('is-invalid');
                qtd.classList.add('campo-obrigatorio');
            }
            if (isNaN(valorUnitario.value)) {
                valorUnitario.classList.add('is-invalid');
                valorUnitario.classList.add('campo-obrigatorio');
            }
        }
    }
    
    if (produtosInvalidos) {
        camposFaltantes.push('Todos os campos obrigatórios dos produtos');
    }
    
    if (valoresInvalidos) {
        camposFaltantes.push('Valores numéricos válidos para quantidade e valor unitário');
    }

    if (Object.keys(anexosEmMemoria).length === 0) {
        camposFaltantes.push('Pelo menos um documento anexado');
    }
    
    if (camposFaltantes.length > 0) {
        if (mostrarModal) {
            const loadingSpinner = document.getElementById('loadingSpinner');
            const modalMessage = document.getElementById('modalMessage');
            const btnCloseModal = document.getElementById('btnCloseModal');
            
            loadingSpinner.style.display = 'none';
            
            let mensagem = '<div class="alert alert-warning">';
            mensagem += '<h5 class="mb-3"><i class="bi bi-exclamation-triangle"></i> Campos obrigatórios não preenchidos</h5>';
            mensagem += '<p>Por favor, complete os seguintes campos para continuar:</p>';
            mensagem += '<ul class="list-group list-group-flush mb-2">';
            camposFaltantes.forEach(campo => {
                mensagem += `<li class="list-group-item list-group-item-warning mb-2">${campo}</li>`;
            });
            mensagem += '</ul>';
            mensagem += '</div>';
            
            // Atualiza e exibe o modal
            modalMessage.innerHTML = mensagem;
            btnCloseModal.style.display = 'inline-block';
            modalLoading.show();
        }
        
        return false;
    }
    
    return true;
}

/**
 * Função para gerar e baixar o JSON com os dados do formulário
 * Coleta todos os dados do formulário, cria um objeto JSON e gera um arquivo para download
 * @return {Object} Objeto com todos os dados coletados
 */
function gerarEBaixarJSON() {
    const dadosEmpresa = {
        razaosocial: document.getElementById('razaosocial').value.trim(),
        nomefantasia: document.getElementById('nomefantasia').value.trim(),
        cnpj: document.getElementById('cnpj').value.trim(),
        inscricaoestadual: document.querySelector('[name="inscricaoestadual"]').value.trim(),
        inscricaomunicipal: document.querySelector('[name="inscricaomunicipal"]').value.trim(),
        cep: document.getElementById('cep').value.trim(),
        endereco: document.getElementById('endereco').value.trim(),
        nomedapessoadecontato: document.getElementById('nomedapessoadecontato').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim()
    };

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
    
    return dados;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando evento do botão de download');
    const btnDownloadJSON = document.getElementById('btnDownloadJSON');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const modalMessage = document.getElementById('modalMessage');

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            modalLoading.hide();
        });
    }
    

    if (btnDownloadJSON) {
        btnDownloadJSON.addEventListener('click', function() {
            console.log('Botão de download clicado');
            if (validarFormularioCompleto(true)) {
                loadingSpinner.style.display = 'inline-block';
                modalMessage.textContent = 'Gerando JSON...';
                btnCloseModal.style.display = 'none';
                modalLoading.show();
                
                setTimeout(() => {
                    // Gera e baixa o JSON
                    gerarEBaixarJSON();
                    
                    loadingSpinner.style.display = 'none';
                    modalMessage.textContent = 'JSON baixado com sucesso!';
                    btnCloseModal.style.display = 'inline-block';
                }, 1000);
            }
        });
        console.log('Evento configurado com sucesso');
    } else {
        console.error('Botão de download não encontrado no DOM');
    }
    

    document.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            this.classList.remove('campo-obrigatorio');
            
            const errorDiv = document.getElementById(this.id + '-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
        
        campo.addEventListener('focus', function() {
            this.classList.remove('campo-obrigatorio');
        });
    });
});

