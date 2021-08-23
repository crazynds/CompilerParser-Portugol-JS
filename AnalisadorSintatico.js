var gramatica={}

var auxiliar = 0;

function firstAll(element){
    var fir = [];
    if(element.first)return element.first;
    element.patterns.forEach(element => {
        Array.prototype.push.apply(fir,first(element))
    });
    element.first = fir.filter((v, i, a) => a.indexOf(v) === i)
    return element.first;
}

function first(pattern){
    if(pattern.patterns)return firstAll(pattern)
    if(pattern[0]==undefined)return['§']
    if(typeof pattern[0] == 'string')return [pattern[0]]
    if(pattern[0].patterns)return firstAll(pattern[0])
    return first(pattern[0])
}

function follow(element){
    if(typeof element=='string'){
        return [element]
    }
    var fol=[]
    if(element.follow){
        if(typeof element.follow=='number'){
            if(element.follow>10){
                return [];
            }
            element.follow++;
        }else return element.follow;
    }else{
        element.follow=1;
    }
    
    if(element.isFirst)fol.push('$');
    
    auxiliar++;
    if(auxiliar>500){
        console.log('é meu');
    }
    Object.keys(gramatica).forEach((key)=>{
        let obj = gramatica[key]
        obj.patterns.forEach((pattern)=>{
            pattern.forEach((item,index)=>{
                if(item!=element)return;
                let alvo = pattern[index+1];
                if(alvo!=undefined){
                    //Get follow de Beta
                    let aux = first(alvo)
                    Array.prototype.push.apply(fol,aux.filter((v)=>v!='§'))
                    if(!aux.includes("§"))return;
                }
                if(obj==element)return;
                Array.prototype.push.apply(fol,follow(obj));
            })
        })
    })
    if(typeof element.follow =='number' || element.follow==undefined){
        element.follow=fol.filter((v, i, a) => a.indexOf(v) === i);
    }else {
        Array.prototype.push.apply(element.follow,fol.filter((v, i, a) => a.indexOf(v) === i));
        element.follow = [...new Set(element.follow)]
    }
    return element.follow;
}


var mat = {}
function addToMat(regra){
    auxiliar=0;
    regra.patterns.forEach((pattern)=>{
        let vet =first(pattern)
        vet.forEach((item)=>{
            if(item=='§')return;
            if(mat[regra.name]==undefined)mat[regra.name]={};
            let auxiliarPaterns = [];
            pattern.forEach((element)=>{
                auxiliarPaterns.push(element.toString());
            });
            mat[regra.name][item]={
                name : regra.name+' -> '+auxiliarPaterns.join(' '),
                pilha: [...pattern],
            }
        })
        if(vet.includes('§')){
            let fol = follow(regra)
            fol.forEach((item)=>{
                if(!mat[regra.name][item])
                    mat[regra.name][item]={
                        name: regra.name+' -> §',
                        pilha: [],
                    }
            })
        }
    })
}

function criarGramatica(obj){
    gramatica = obj;
    mat = {};
    Object.keys(gramatica).forEach((key)=>{
        let gramar = gramatica[key];
        console.info(gramar.toString());
        gramar.patterns.forEach(function(array,patternKey){
            array.forEach((item,posPatern)=>{
                if(/^<[^>]*>$/.test(item)){
                    let aux=false;
                    Object.keys(gramatica).every((key2)=>{
                        let gramar2 = gramatica[key2]
                        if(gramar2.name==item){
                            gramar.patterns[patternKey][posPatern]=gramar2;
                            aux=true;
                            return false;
                        }
                        return true;
                    });
                    if(aux==false){
                        console.error("Não achado a gramatica equivalente a : "+item);
                    }
                }
            })
        })
    })
    Object.keys(gramatica).forEach((key)=>{
        addToMat(gramatica[key]);
    });
    return mat;
}



module.exports={
    criarGramatica,
}