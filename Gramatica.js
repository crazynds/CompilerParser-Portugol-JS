module.exports={
    start: {
        isFirst: true,
        name: '<start>',
        patterns:[
            ['<funcao>','<start\'>']  // <start> : <funcao> <start'>
        ],
        toString(){
            return this.name
        }
    },
    startl: {
        name: '<start\'>',
        patterns:[
            ['<funcao>','<start\'>'],  // <start'> : <funcao> <start'>
            [],     //<start'> : <vazio>
        ],
        toString(){
            return this.name
        }
    },
    funcao:{
        name: '<funcao>',
        patterns:[
            ['<tipo>','<variavel>','(','<parametros>',')','{','<comando\'>','}']  // <funcao> : <tipo> <variavel> (<parametros>) <comando'>
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            let table = semantica.table;
            let func = {
                type: "FUNC",
                name: tree.childrens[1].variavel,
                return: tree.childrens[0].type.toUpperCase(),
                params: tree.childrens[3].params,
                deep: 1,
            }
            tree.func = func;
            let aux = table.createVariable(func.name,func);
            if(aux){
                aux.error = {
                    pos: semantica.lexico.getPosition(),
                    str: "Esse nome de variavel("+tree.childrens[1].variavel+") já esta sendo utilizado e não pode ser re-declarado.",
                }
                return aux;
            }
        }
    },
    tipo:{
        name: '<tipo>',
        patterns:[
            ['char'],['real'],['inteiro'],['cadeia'],['vazio']    //<tipo> : char | real | inteiro | cadeia | vazio
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.type = tree.childrens[0].token.getComparable();
            return null;
        }
    },
    variavel:{
        name: '<variavel>',
        patterns: [
            ['ID']  //<variavel>: ID
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.variavel = tree.childrens[0].token.str;
            return null;
        }
    },
    variavel_chamada:{
        name: '<variavel_chamada>',
        patterns: [
            ['<variavel>','<chamada>']  
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.variavel = tree.childrens[0].variavel;
            if(!semantica.table.hasVariable(tree.variavel)){
                return {
                    message:"Erro no analisador semantico!",
                    error:{
                        pos: semantica.lexico.getPosition(),
                        str: "Essa variavel("+tree.variavel+") não existe declarada.",
                    }
                }
            }
            let vari = semantica.table.getVariable(tree.variavel);
            
            tree.type = vari.type.toUpperCase();
            if(vari.type!='FUNC' && tree.chamada=='FUNC'){
                return {
                    message:"Erro no analisador semantico!",
                    error:{
                        pos: semantica.lexico.getPosition(),
                        str: "Esse variavel("+tree.variavel+") não pode ser chamada como função, pois não foi declarada como função.",
                    }
                }
            }
            if(tree.chamada=='FUNC'){
                tree.type = vari.return.toUpperCase();
            }

            return null;
        }
    },
    chamada:{
        name: '<chamada>',
        patterns: [
            ['<exec_func>'],  
            []
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            if(tree.childrens.length>0){
                tree.father.chamada = 'FUNC';
            }else{
                tree.father.chamada = 'VARI';
            }
        }
    },
    parametros:{
        name: '<parametros>',
        patterns: [
            ['<declaracao>','<parametros\'>'],  //<parametros>: <declaracao> <parametros'>
            ['vazio'],  //<parametros>: vazio
            []          //<parametros>: <vazio>
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            if(tree.childrens.length<=0)return null;
            if(tree.childrens[0]=='vazio')return null;
            for(let i=0;i<tree.childrens.length;i+=2){
                if(i%2==0){
                    let vari = {
                        name: tree.childrens[i].variavel,
                        type: tree.childrens[i].type,
                        deep: 1
                    }
                    let aux =semantica.table.createVariable(vari.name,vari);
                    if(aux){
                        aux.error = {
                            pos: semantica.lexico.getPosition(),
                            str: "Esse nome de variavel("+tree.childrens[i].variavel+") já esta sendo utilizado e não pode ser re-declarado.",
                        }
                        return aux;
                    }
                }
            }
        }
    },
    parametrosl:{
        name: '<parametros\'>',
        patterns: [
            [',','<declaracao>','<parametros\'>'],  //<parametros'>: ,<declaracao> <parametros'>
            []      //<parametros'>: <vazio>
        ],
        toString(){
            return this.name
        }
    },
    declaracao:{
        name: '<declaracao>',
        patterns: [
            ['<tipo>','<variavel>'],    // <declaracao> : <tipo> <variavel>
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.type = tree.childrens[0].type;
            tree.variavel = tree.childrens[1].variavel;
            if(tree.type=='vazio'){
                return {
                    message:"Erro no analisador semantico!",
                    error:{
                        pos: semantica.lexico.getPosition(),
                        str: "Não é permitido declarar uma variavel do tipo vazio.",
                    }
                }
            }
        }
    },
    multi_declaracao:{
        name: '<multi_declaracao>',
        patterns: [
            ['<declaracao>','<multi_declaracao\'>'],    //<multi_declaracao> : <declaracao> <multi_declaracao'>
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            let type = tree.childrens[0].type;
            for(let i=0;i<tree.childrens.length;i+=2){
                if(i%2==0){
                    let vari = {
                        name: tree.childrens[i].variavel,
                        type,
                        deep: 1
                    }
                    aux = semantica.table.createVariable(vari.name,vari);
                    if(aux){
                        aux.error = {
                            pos: semantica.lexico.getPosition(),
                            str: "Esse nome de variavel("+tree.childrens[i].variavel+") já esta sendo utilizado e não pode ser re-declarado.",
                        }
                        return aux;
                    }
                }
            }
        }
    },
    multi_declaracaol:{
        name: '<multi_declaracao\'>',
        patterns: [
            [',', '<variavel>' ,'<multi_declaracao\'>'],    //<multi_declaracao'> : ,<variavel> <multi_declaracao'>
            []  //<multi_declaracao'> : <vazio>
        ],
        toString(){
            return this.name
        }
    },
    exec_func:{
        name: '<exec_func>',
        patterns: [
            ['(','<argumentos>',')'],    //<exec_func>: (<argumentos>)
        ],
        toString(){
            return this.name
        }
    },
    argumentos:{
        name: '<argumentos>',
        patterns:[
            ['<argumento>','<argumentos\'>'], //<argumentos>: <argumento> <argumentos'>
            []  //<argumentos>: <vazio>
        ],
        toString(){
            return this.name
        }
    },
    argumentosl:{
        name: '<argumentos\'>',
        patterns:[
            [',','<argumento>','<argumentos\'>'], //<argumentos>:  , <argumento> <argumentos'>
            []  //<argumentos'>: <vazio>
        ],
        toString(){
            return this.name
        }
    },
    argumento:{
        name: '<argumento>',
        patterns:[
            ['<variavel>'], //<argumento>: <variavel> 
            ['<num>'],  //<argumento>: <num>
            ['<string>'],  //<argumento>: <string>
            ['<calculo>']
        ],
        toString(){
            return this.name
        },
    },
    num:{
        name: '<num>',
        patterns:[
            ['REAL'], //<num>: REAL
            ['INTEIRO'],  //<num>: INTEIRO
            ['CHAR'],  //<num>: CHAR
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.type = tree.childrens[0].token.getComparable();
        }
    },
    comparacao:{
        name: '<comparacao>',
        patterns:[
            ['=='], 
            ['!='],  
            ['>'],
            ['<'], 
            ['>='],  
            ['<='],
        ],
        toString(){
            return this.name
        }
    },
    string:{
        name: '<string>',
        patterns:[
            ['CADEIA'], //<string>: CADEIA
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.type = tree.childrens[0].token.getComparable();
        }
    },
    condicoes:{
        name: '<condicoes>',
        patterns:[
            ['<condicoes_or>'], //<condicoes>:  <condicao_or> 
        ],
        toString(){
            return this.name
        }
    },
    condicoes_or:{
        name: '<condicoes_or>',
        patterns:[
            ['<condicoes_and>','<condicoes_or\'>']
        ],
        toString(){
            return this.name
        }
    },
    condicoes_orl:{
        name: '<condicoes_or\'>',
        patterns:[
            ['||','<condicoes_and>','<condicoes_or\'>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    condicoes_and:{
        name: '<condicoes_and>',
        patterns:[
            ['<condicao>','<condicoes_and\'>']
        ],
        toString(){
            return this.name
        }
    },
    condicoes_andl:{
        name: '<condicoes_and\'>',
        patterns:[
            ['&&','<condicao>','<condicoes_and\'>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    condicao:{
        name: '<condicao>',
        patterns:[
            ['(','<condicoes>',')'],
            ['<calculo>','<comparacao>','<calculo>']
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            if(tree.childrens[0].name=='<calculo>'){
                if(tree.childrens[0].type!=tree.childrens[2].type){
                    return {
                        message:"Erro no analisador semantico!",
                        error: {
                            pos: semantica.lexico.getPosition(),
                            str: "Comparação entre dois tipos diferentes: "+tree.childrens[0].type+" e "+tree.childrens[2].type,
                        }
                    }
                }
            }
        }
    },
    estrutura:{
        name: '<estrutura>',
        patterns:[
            ['<estrutura_se>','<estrutura_senao>'], //<estrutura>: se (<condicoes>)<comando>
            ['enquanto', '(','<condicoes>',')','<comando>'], //enquanto (<condicoes>)<comando>
        ],
        toString(){
            return this.name
        }
    },
    estrutura_se:{
        name: '<estrutura_se>',
        patterns:[
            ['se','(','<condicoes>',')','<comando>'],
        ],
        toString(){
            return this.name
        }
    },
    estrutura_senao:{
        name: '<estrutura_senao>',
        patterns:[
            ['senao','<comando>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    variavel_exec:{
        name: "<variavel_exec>",
        patterns:[
            ['=','<calculo>'],
            ['<exec_func>'],
        ],
        toString(){
            return this.name
        },
        check(semantica,tree){
            if(semantica.table.hasVariable(tree.father.childrens[0].variavel)==false)
                return {
                    message:"Erro no analisador semantico!",
                    error:{
                        pos: semantica.lexico.getPosition(),
                        str: "Essa variavel("+tree.father.childrens[0].variavel+") não existe declarada.",
                    }
                }
            if(tree.childrens[0].name=='='){
                let typeVar = semantica.table.getVariable(tree.father.childrens[0].variavel).type;
                let calcVal = tree.childrens[1].type;
                switch(typeVar.toUpperCase()){
                    case 'CADEIA':
                        break;
                    case 'CHAR':
                        if(calcVal=='INTEIRO'){
                            return{
                                message:"Erro no analisador semantico!",
                                error: {
                                    pos: semantica.lexico.getPosition(),
                                    str: "Tentativa de atribuição de um inteiro a uma variavel do tipo "+typeVar,
                                }
                            }
                        }
                    case 'INTEIRO':
                        if(calcVal=='REAL'){
                            return{
                                message:"Erro no analisador semantico!",
                                error: {
                                    pos: semantica.lexico.getPosition(),
                                    str: "Tentativa de atribuição de um real a uma variavel do tipo "+typeVar,
                                }
                            }
                        }
                    case 'REAL':
                        if(calcVal=='CADEIA')
                            return{
                                message:"Erro no analisador semantico!",
                                error: {
                                    pos: semantica.lexico.getPosition(),
                                    str: "Tentativa de atribuição de uma cadeia a uma variavel do tipo "+typeVar,
                                }
                            }
                        break;
                }
            }
        }
    },
    lista_comandos:{
        name: "<lista_comandos>",
        patterns:[
            ['{','<comando\'>','}'],
        ],
        toString(){
            return this.name
        },
    },
    comando:{
        name: "<comando>",
        patterns:[
            ['<estrutura>'],
            ['<variavel>','<variavel_exec>',';'],
            ['<multi_declaracao>',';'],
            ['<lista_comandos>']
        ],
        toString(){
            return this.name
        },
        check(semantica,tree){
            for(let i=0;i<tree.childrens.length;i++)
                if(tree.childrens[i].element.check!=undefined)
                    tree.childrens[i].element.check(semantica,tree.childrens[i]);
        }
    },
    comandol:{
        name: "<comando'>",
        patterns:[
            ['<comando>','<comando\'>'],
            ['<retorna>'],
            [],
        ],
        toString(){
            return this.name
        }
    },
    retorna:{
        name: "<retorna>",
        patterns:[
            ['retorna','<argumento>',';'],
        ],
        toString(){
            return this.name
        }
    },
    calculo:{
        name : "<calculo>",
        patterns: [
            ['<calculo_1>'],
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            tree.type = tree.childrens[0].type;
        }
    },
    calculo1:{
        name : "<calculo_1>",
        patterns: [
            ['<calculo_2>','<calculo_1\'>'],
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            let myType = tree.childrens[0].type;
            for(let i = 2;i<tree.childrens.length;i+=2){
                let type = tree.childrens[i-1].name;
                let yourType = tree.childrens[i].type;
                if(myType=='CADEIA' || yourType=='CADEIA' && type=='+'){
                    myType = 'CADEIA';
                    continue;
                }else if(myType=='CADEIA' || yourType=='CADEIA'){
                    return {
                        message:"Erro no analisador semantico!",
                        error: {
                            pos: semantica.lexico.getPosition(),
                            str: "Não é possivel executar calculo de subtração de cadeia com outros tipos",
                        }
                    }
                }
                switch(myType){
                    case 'CHAR':
                    case 'INTEIRO':
                        switch(yourType){
                            case 'CHAR':
                                myType='INTEIRO';
                                break;
                            case 'INTEIRO':
                                myType='INTEIRO';
                                break;
                            case 'REAL':
                                myType='REAL';
                                break;
                        }
                        break;
                    case 'REAL':
                        continue;
                }
            }
            tree.type=myType;
        }
    },
    calculo1l:{
        name : "<calculo_1'>",
        patterns: [
            ['+','<calculo_2>','<calculo_1\'>'],
            ['-','<calculo_2>','<calculo_1\'>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    calculo2:{
        name : "<calculo_2>",
        patterns: [
            ['<calculo_3>','<calculo_2\'>'],
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            let myType = tree.childrens[0].type;
            for(let i = 2;i<tree.childrens.length;i+=2){
                let yourType = tree.childrens[i].type;
                if(myType=='CADEIA' || yourType=='CADEIA'){
                    return {
                        message:"Erro no analisador semantico!",
                        error :{
                            pos: semantica.lexico.getPosition(),
                            str: "Não é possivel executar calculos de multimplicação e divisão usando tipos de cadeia",
                        }
                    }
                }
                switch(myType){
                    case 'CHAR':
                    case 'INTEIRO':
                        switch(yourType){
                            case 'CHAR':
                                myType='INTEIRO';
                                break;
                            case 'INTEIRO':
                                myType='INTEIRO';
                                break;
                            case 'REAL':
                                myType='REAL';
                                break;
                        }
                        break;
                    case 'REAL':
                        continue;
                }
            }
            tree.type=myType;
        }
    },
    calculo2l:{
        name : "<calculo_2'>",
        patterns: [
            ['*','<calculo_3>','<calculo_2\'>'],
            ['/','<calculo_3>','<calculo_2\'>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    calculo3:{
        name : "<calculo_3>",
        patterns: [
            ['<calculo_val>','<calculo_3\'>'],
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            let myType = tree.childrens[0].type;
            for(let i = 2;i<tree.childrens.length;i+=2){
                let yourType = tree.childrens[i].type;
                if(myType=='CADEIA' || yourType=='CADEIA'){
                    return {
                        message:"Erro no analisador semantico!",
                        error: {
                            pos: semantica.lexico.getPosition(),
                            str: "Não é possivel executar calculos de exponenciação usando tipos de cadeia",
                        }
                    }
                }
                switch(myType){
                    case 'CHAR':
                    case 'INTEIRO':
                        switch(yourType){
                            case 'CHAR':
                                myType='INTEIRO';
                                break;
                            case 'INTEIRO':
                                myType='INTEIRO';
                                break;
                            case 'REAL':
                                myType='REAL';
                                break;
                        }
                        break;
                    case 'REAL':
                        continue;
                }
            }
            tree.type=myType;
        }
    },
    calculo3l:{
        name : "<calculo_3'>",
        patterns: [
            ['^','<calculo_val>','<calculo_3\'>'],
            []
        ],
        toString(){
            return this.name
        }
    },
    calculo_val:{
        name : "<calculo_val>",
        patterns: [
            ['<variavel_chamada>'],
            ['<num>'],
            ['<string>'],
        ],
        toString(){
            return this.name
        },
        check: function(semantica,tree){
            switch(tree.childrens[0].name){
                case '<variavel_chamada>':
                    tree.type = tree.childrens[0].type;
                    break;
                case '<num>':
                    tree.type = tree.childrens[0].type;
                    break;
                case '<string>':
                    tree.type = tree.childrens[0].type;
                    break;
            }
        }
    }
}