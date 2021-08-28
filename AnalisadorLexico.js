
const fs = require('fs');
const util = require('util');

const regexComents = '(//[^\\n]*\\n|\\/\\*((?!\\*\\/)(.|\\s))*\\*\\/)';
const regexDelimitadores = '(;|\\(|\\)|\\{|\\}|,)';
const regexText = '[_0-9a-zA-Z]+(\\.[_0-9a-zA-Z]+)?';
const regexChar = '(\'\\\\?[^\'\r\n\t]\')'
const regexString = '("[^"]*")';
const regexOperators = '(-|\\+|\\/|\\*|\\^)';
const regexAtribuicao = '(=)';
const regexBoolean = '(>=?|<=?|==|!=|<|>|&&|\\|\\|)';
const regexReservadas = '(se|enquanto|para|leitura|escrita|vazio|retorna|senao)';
const regexTipos = '(inteiro|cadeia|real|char)';
const allRegex = [regexComents,regexText,regexChar,regexString,regexBoolean,regexAtribuicao,regexOperators,regexDelimitadores,regexReservadas,regexTipos];


const regexNumber = '[0-9]+(\\.[0-9]+)?'; // Checa se é numero
const regexVar = '[_a-zA-Z][_a-zA-Z\\d]*'; // Checa se é variavel

const regexGlobal = '('+allRegex.join([separador='|'])+')';

const testExactMatch = function(text,regex){
    let r = new RegExp('^'+regex+'$','');
    return r.test(text);
}

const checkIfUndentifiedTokenExist = function(string,{line,col}){
    let pos=null,str;
    if((str=/[^\s]+/.exec(string))!=null){
        pos = {
            line: line,
            col: col+str.index,
        }
        str = str[0];
    }
    if(pos)return {pos,str}
    else return null
}

const tokenClassify = function(element){
    switch(true){
        case testExactMatch(element,regexNumber):
            if(!isNaN(element) && element.indexOf('.')!=-1){
                return 'Real';
            }else{
                return 'Integer';
            }
        case testExactMatch(element,regexReservadas):
            return 'Reservada';
        case testExactMatch(element,regexChar):
            return 'Char';
        case testExactMatch(element,regexString):
            return 'String';
        case testExactMatch(element,regexOperators):
            return 'Operador';
        case testExactMatch(element,regexAtribuicao):
            return 'Atribuicao';
        case testExactMatch(element,regexBoolean):
            return 'Boolean';
        case testExactMatch(element,regexDelimitadores):
            return 'Delimitador';
        case testExactMatch(element,regexTipos):
            return 'Tipo';
        case testExactMatch(element,regexVar):
            return 'Variavel';
    }
    return 'NotFound';
}

const extractToken = function(string,{col,line}){
    let regex = new RegExp(regexGlobal,'');
    
    let pos = string.search(regex);
    let analiseString;
    if(pos!=-1){
        analiseString= string.substring(0,pos);
    }else {
        analiseString = string;
    }
    
    
    let aux;
    let newLineRegex = /[\r\n]{1,2}/;
    let error=null;
    while((aux=newLineRegex.exec(analiseString)) != null){
        error = checkIfUndentifiedTokenExist(analiseString.substring(0,aux.index),{line: (line),col});
        analiseString = analiseString.substring(aux.index+aux[0].length);
        line+=1;
        col=1;
        if(error)break;
    }
    if(!error)error = checkIfUndentifiedTokenExist(analiseString,{line: line,col});
    else{
        return{
            error,
            newString: null,
            newPosition: error.pos,
            token:null
        }
    }
    col+=analiseString.length;
    let newString,token=null,item
    if(pos!=-1){
        item = regex.exec(string)[0]
        if(testExactMatch(item,regexComents)){
            let qtd = item.split(/\r\n|\r|\n/).length-1;
            if(qtd<0)qtd=0;
            return extractToken(string.substring(pos+item.length),{line: line+qtd,col});
        }
        token = {
            str: item,
            pos: {
                col: col,
                line: line,
            },
            class: tokenClassify(item),
            print: function(){
                console.log('Type: '+this.class+'|Comparable: "'+this.getComparable()+'"|Position: line='+this.pos.line+' col='+this.pos.col)
            },
            getComparable:function(){
                switch(this.class){
                case 'Real':
                    return 'REAL'
                case 'Integer':
                    return 'INTEIRO'
                case 'Reservada':
                    return this.str.toLowerCase()
                case 'String':
                    return 'CADEIA'
                case 'Operador':
                    return this.str
                case 'Atribuicao':
                    return '='
                case 'Boolean':
                    return this.str
                case 'Delimitador':
                    return this.str
                case 'Tipo':
                    return this.str.toLowerCase()
                case 'Char':
                    return 'CHAR';
                case 'Variavel':
                    return 'ID';
                default:
                    return undefined;
                }
            },
        }
        newString = string.substring(pos+token.str.length);
    }else{
        token = null;
        newString = null;
    }
    
    return {
        error,
        newString,
        newPosition: {
            col: col+ ((token)?token.str:"").length,
            line: line,
        },
        token
    }
}



module.exports = {
    start: (fileStr)=> {
        var data =fs.readFileSync(fileStr, "utf8");
        var value = extractToken(data,{col:1,line:1});
        return {
            content: value,
            getToken: function(){
                return this.content.token;
            },
            getError: function(){
                return this.content.error;
            },
            getPosition: function(){
                return this.content.newPosition;
            },
            printError: function(){
                if(this.content.error!=null){
                    console.log("\tCaractere não reconhecido:")
                    console.log("String: '"+this.content.error.str+"'");
                    console.log("Posição: \n\tlinha="+this.content.error.pos.line+" \tcoluna="+this.content.error.pos.col)
                }
                if(this.content.token!=null)
                    if(this.content.token.class=='NotFound'){
                        console.log("\tToken não indentificado a nenhum tipo reconhecivel:")
                        console.log("Token: '"+this.content.token.str+"'")
                        console.log("Posição: \n\tlinha="+this.content.token.pos.line+" \tcoluna="+this.content.token.pos.col)
                    }
            },
            hasToken: function(){
                return this.content.token !=null;
            },
            hasError: function(){
                if(this.content.token==null)return this.content.error !=null;
                return this.content.error !=null || this.content.token.class=='NotFound';
            },
            next: function(){
                this.content= extractToken(this.content.newString,this.content.newPosition);
            }
        }
    },
};

