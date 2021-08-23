const AnalisadorLexico = require('./AnalisadorLexico');
const AnalisadorSintatico = require('./AnalisadorSintatico');
const AnalisadorSemanatico = require('./AnalisadorSemantico');
const gramatica = require('./Gramatica');

var lexico = AnalisadorLexico.start('r1.txt')


console.log('Carregando gramatica...');
var matrizDaGramatica = AnalisadorSintatico.criarGramatica(gramatica);
console.log('Gramatica carregada!')


var arvore = AnalisadorSemanatico.analisaGramatica(lexico,matrizDaGramatica);

