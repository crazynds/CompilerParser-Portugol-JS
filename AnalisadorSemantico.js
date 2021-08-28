
function startTree(){
    return {
        name : '<start>',
        childrens : [],
        token: null,
        father: null,
    }
}
function startTable(){
    return {
        variables: {
            escreve:{
                name: 'escreve',
                type: "FUNC",
                params: ["CADEIA"],
                return: "VOID",
                deep: 100,
            },
            le:{
                name: 'le',
                type: "FUNC",
                params: [],
                return: "CHAR",
                deep: 100,
            }
        },
        createVariable: function(name,variavel){
            if(this.variables[name]!=undefined)return {
                message: "Erro no analisador semantico!",
            };
            else{
                if(variavel.deep==undefined)variavel.deep=1;
                if(variavel.deep<=0)return null;
                this.variables[name] = variavel;
                return null;
            }
        },
        releaseVariable: function(name){
            delete this.variables[name];
        },
        hasVariable: function(name){
            return (this.variables[name]!=undefined);
        },
        getVariable: function(name){
            return this.variables[name];
        },
        deep: function(qtd){
            for(var variavel in this.variables){
                this.variables[variavel].deep+=qtd;
            }
        },
        undeep: function(qtd){
            for(var variavel in this.variables){
                this.variables[variavel].deep-=qtd;
                if(this.variables[variavel].deep<=0){
                    this.releaseVariable(variavel);
                }
            }
        }
    }
}

function checkErrorLexico(lexico){
    if(lexico.hasError())return {
        message: "Erro no analisador léxico!",
        error: lexico.getError(),
    };
    if(!lexico.hasToken())return {
        message: "Erro no analisador sintático!",
        error: {
            pos: lexico.getPosition(),
            str: "Fim do arquivo encontrado. Era esperado ao menos um token.",
        },
    };
    return null;
}


function execGramaticaRec(semantica,tree,name){
    let lexico = semantica.lexico;
    let mat = semantica.mat;
    let table = semantica.table;
    let nextCmp = name;
    let error = checkErrorLexico(lexico);
    let tokenVal = (lexico.hasToken())?lexico.getToken().getComparable():'$';
    var exectable = mat[nextCmp][tokenVal];

    if(error && exectable==undefined)return error;
    else error = null;
    if(exectable==undefined){
        error = {
            message: "Erro no analisador sintático!",
            error: {
                pos: lexico.getToken().pos,
                str: "Token não esperado foi encontrado '"+lexico.getToken().str+"' e não encaixa na gramatica ("+name+")!",
            },
        }
    }else exectable.pilha.every((element)=>{
        let objTree = {
            name : element.toString(),
            father: tree,
            element: element,
        }
        if(typeof element == 'string'){
            tree.childrens.push(objTree);
            objTree.token=null;
            if(objTree.name != lexico.getToken().getComparable()){
                error = {
                    message: "Erro no analisador sintático!",
                    error: {
                        pos: lexico.getToken().pos,
                        str: "Esperado o token de tipo '"+objTree.name+"' mas encontrado token '"+lexico.getToken().str+"' do tipo '"+lexico.getToken().getComparable()+"'.",
                    },
                }
                return false;
            }else{
                error = checkErrorLexico(lexico);
                if(error!=null)return false
                objTree.token = lexico.getToken()
                lexico.next();
            }
        }else{
            objTree.childrens = [];
            if(objTree.name.replace("'",'') == tree.name || tree.name == objTree.name){
                error = execGramaticaRec(semantica,tree,objTree.name);
                if(element.check!=undefined && error==null){
                    error = element.check(semantica,tree);
                }
            }else{
                tree.childrens.push(objTree);
                table.deep(1);
                error = execGramaticaRec(semantica,objTree,objTree.name);    
                table.undeep(1);
                if(element.check!=undefined && error==null){
                    error = element.check(semantica,objTree);
                }
            }
            if(error!=null)return false;
        }
        return true;
        
    })


    return error;
}

function analisaGramatica(lexico,mat){
    let semantica = {
        tree: startTree(),
        table: startTable(),
        lexico,
        mat,
    }
    let error = checkErrorLexico(lexico);
    if(error==null){
        error = execGramaticaRec(semantica,semantica.tree,semantica.tree.name)
    }
    if(error!=null){
        //exec error!
        console.log(error);
        return null;
    }
    return semantica.tree;
}

module.exports={
    analisaGramatica,
}