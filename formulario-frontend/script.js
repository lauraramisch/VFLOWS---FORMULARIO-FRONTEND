// FUN PARA SOMENTE NUMEROS COM MASCARAS
function mascaraCNPJ(valor){
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    return valor;
}

function mascaraCEP(valor){
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    return valor;
}

function mascaraTELEFONE(valor){
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
    return valor;
}

// APLICANDO AS MASCARAS

document.querySelector('input[name="cnpj"]').addEventListener('input', function  (){
    this.value = mascaraCNPJ(this.value);
})

document.getElementById('cep').addEventListener('input', function(){
    this.value = mascaraCEP(this.value);
})

document.querySelector('input[name"telefone"]').addEventListener('input', function(){
    this.value = mascaraTELEFONE(this.value);
})

// BUSCA ENDERECO PELO CEP
document,getElementById('cep').addEventListner('blur', function(){
    let cep = this.value.replace(/\D/g, '');
    if (cep.lenght === 8){
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(dara =>{
            if (!data.erro){
                document.getElementById('endereco').value = `${data.logadouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            } else{
                alert("CEP NAO ENCONTRADO!");
            }
        })
         .catch(() => alert('ERRO AO BUSCAR CEP!'));
    }else{
        alert("CEP INVALIDO!");

    }

});

// AO ENVIAR O FORMULARIO
document.getElementById('formCadastro').addEventListener('submit', function(e){
    e.preventDefault();
    alert("FORMULARIO ENVIADO COM SUCESSO!");
});