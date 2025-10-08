
const br = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const n2 = x=>Number(x??0).toFixed(2);
function taxaMensalEfetiva(a){return Math.pow(1+(a||0),1/12)-1;}

let linhas = []; // {idx, data, prestacao, extraMensal, extraPontual, juros, amort, totalAmort, saldo}
let parcelasRegistradas = 0;

function ler(){
  return {
    saldo: parseFloat(document.getElementById('saldo').value)||0,
    aea: parseFloat(document.getElementById('taxaEfetiva').value)||0,
    parcela: parseFloat(document.getElementById('valorParcela').value)||0,
    data: document.getElementById('dataLanc').value,
    extra: parseFloat(document.getElementById('valorExtra').value)||0,
    tipoExtra: document.getElementById('tipoExtra').value
  };
}

function atualizarSaldoOut(v){
  document.getElementById('saldoOut').textContent = br.format(v);
  document.getElementById('r_saldo').textContent = br.format(v);
}

function atualizarResumo(){
  const totalExtras = linhas.reduce((s,l)=>s + (l.extraMensal||0) + (l.extraPontual||0), 0);
  const totalJuros = linhas.reduce((s,l)=>s + (l.juros||0), 0);
  const totalAmort = linhas.reduce((s,l)=>s + (l.totalAmort||0), 0);
  document.getElementById('r_parcelas').textContent = parcelasRegistradas;
  document.getElementById('r_extras').textContent = br.format(totalExtras);
  document.getElementById('r_juros').textContent = br.format(totalJuros);
  document.getElementById('r_amort').textContent = br.format(totalAmort);
}

function adicionarLinha(l){
  linhas.push(l);
  const tb = document.getElementById('tbody');
  const tr = document.createElement('tr');
  tr.id = 'linha'+l.idx;
  tr.innerHTML = `<td>${l.idx}</td><td>${l.data}</td><td>${br.format(l.prestacao)}</td><td>${l.extraMensal?br.format(l.extraMensal):''}</td><td>${l.extraPontual?br.format(l.extraPontual):''}</td><td>${br.format(l.juros)}</td><td>${br.format(l.amort)}</td><td>${br.format(l.totalAmort)}</td><td>${br.format(l.saldo)}</td>`;
  tb.appendChild(tr);
  atualizarSaldoOut(l.saldo);
  salvarLocal();
  atualizarResumo();
  atualizarSugerido50();
  atualizarETA();
}

function atualizarLinhaAtual(extraMensal, extraPontual, novoSaldo){
  const l = linhas[linhas.length-1];
  if(!l) return;
  if(extraMensal) l.extraMensal = (l.extraMensal||0) + extraMensal;
  if(extraPontual) l.extraPontual = (l.extraPontual||0) + extraPontual;
  if(typeof novoSaldo === 'number') l.saldo = novoSaldo;
  l.totalAmort = (l.amort||0) + (l.extraMensal||0) + (l.extraPontual||0);
  const tr = document.getElementById('linha'+l.idx);
  const tds = tr.getElementsByTagName('td');
  tds[3].textContent = l.extraMensal?br.format(l.extraMensal):'';
  tds[4].textContent = l.extraPontual?br.format(l.extraPontual):'';
  tds[7].textContent = br.format(l.totalAmort);
  tds[8].textContent = br.format(l.saldo);
  atualizarSaldoOut(l.saldo);
  salvarLocal();
  atualizarResumo();
  atualizarSugerido50();
  atualizarETA();
}

function confirmarParcela(){
  const st = ler();
  const i = taxaMensalEfetiva(st.aea);
  const juros = st.saldo * i;
  const amort = Math.max(st.parcela - juros, 0);
  let novoSaldo = st.saldo - amort;
  if(novoSaldo < 0) novoSaldo = 0;
  document.getElementById('saldo').value = n2(novoSaldo);
  parcelasRegistradas += 1;
  const l = {
    idx: linhas.length + 1,
    data: st.data,
    prestacao: st.parcela,
    extraMensal: 0,
    extraPontual: 0,
    juros: juros,
    amort: amort,
    totalAmort: amort,
    saldo: novoSaldo
  };
  adicionarLinha(l);
  feedback('Parcela confirmada.');
}

function confirmarExtra(){
  const st = ler();
  if(linhas.length === 0){
    feedback('Registre primeiro uma parcela para este mês.');
    return;
  }
  const extra = Math.max(st.extra, 0);
  if(extra <= 0){ feedback('Informe um valor de amortização extra.'); return; }
  let saldoAtual = parseFloat(document.getElementById('saldo').value)||0;
  let novoSaldo = saldoAtual - extra;
  if(novoSaldo < 0) novoSaldo = 0;
  document.getElementById('saldo').value = n2(novoSaldo);
  if(st.tipoExtra === 'mensal'){
    atualizarLinhaAtual(extra, 0, novoSaldo);
  } else {
    atualizarLinhaAtual(0, extra, novoSaldo);
  }
  feedback('Amortização extra confirmada.');
}

function desfazerUltimo(){
  if(linhas.length === 0) return;
  const l = linhas.pop();
  const tb = document.getElementById('tbody');
  const tr = document.getElementById('linha'+l.idx);
  if(tr) tb.removeChild(tr);
  if(l.prestacao > 0) parcelasRegistradas = Math.max(0, parcelasRegistradas - 1);
  const saldoAnterior = linhas.length ? linhas[linhas.length-1].saldo : 251676.44;
  document.getElementById('saldo').value = n2(saldoAnterior);
  atualizarSaldoOut(saldoAnterior);
  salvarLocal();
  atualizarResumo();
  atualizarSugerido50();
  atualizarETA();
  feedback('Último lançamento desfeito.');
}

function resetar(){
  if(!confirm('Tem certeza que deseja resetar a planilha?')) return;
  linhas = []; parcelasRegistradas = 0;
  document.getElementById('tbody').innerHTML = '';
  document.getElementById('saldo').value = '251676.44';
  atualizarSaldoOut(251676.44);
  salvarLocal();
  atualizarResumo();
  atualizarSugerido50();
  atualizarETA();
  feedback('Planilha resetada.');
}

function exportarCSV(){
  const header = ['#','Data','Prestação','Extra Mensal','Extra Pontual','Juros','Amortização','Total Amortizado','Saldo'];
  const rows = [header.join(',')];
  linhas.forEach(l => {
    rows.push([
      l.idx, l.data, n2(l.prestacao),
      n2(l.extraMensal||0), n2(l.extraPontual||0),
      n2(l.juros||0), n2(l.amort||0), n2(l.totalAmort||0), n2(l.saldo||0)
    ].join(','));
  });
  const blob = new Blob([rows.join('\\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ROSELY_v29_lancamentos.csv'; a.click();
}

function feedback(txt){
  const msg = document.getElementById('msg');
  msg.textContent = txt; msg.style.display='inline-block';
  setTimeout(()=>{ msg.style.display='none'; }, 1500);
}

function salvarLocal(){
  localStorage.setItem('rosely_v29', JSON.stringify({
    linhas, parcelasRegistradas,
    saldo: document.getElementById('saldo').value,
    taxa: document.getElementById('taxaEfetiva').value,
    parcela: document.getElementById('valorParcela').value,
    data: document.getElementById('dataLanc').value,
    extra: document.getElementById('valorExtra').value
  }));
}

function carregarLocal(){
  const raw = localStorage.getItem('rosely_v29');
  if(!raw){ 
    atualizarSaldoOut(parseFloat(document.getElementById('saldo').value)||0); 
    atualizarResumo(); 
    atualizarSugerido50(); 
    atualizarETA(); 
    return; 
  }
  try{
    const o = JSON.parse(raw);
    if(o.saldo) document.getElementById('saldo').value = o.saldo;
    if(o.taxa) document.getElementById('taxaEfetiva').value = o.taxa;
    if(o.parcela) document.getElementById('valorParcela').value = o.parcela;
    if(o.data) document.getElementById('dataLanc').value = o.data;
    if(o.extra) document.getElementById('valorExtra').value = o.extra;
    linhas = o.linhas||[]; parcelasRegistradas = o.parcelasRegistradas||0;
    const tb = document.getElementById('tbody');
    tb.innerHTML = '';
    linhas.forEach(l=>{
      const tr = document.createElement('tr');
      tr.id = 'linha'+l.idx;
      tr.innerHTML = `<td>${l.idx}</td><td>${l.data}</td><td>${br.format(l.prestacao)}</td><td>${l.extraMensal?br.format(l.extraMensal):''}</td><td>${l.extraPontual?br.format(l.extraPontual):''}</td><td>${br.format(l.juros)}</td><td>${br.format(l.amort)}</td><td>${br.format(l.totalAmort)}</td><td>${br.format(l.saldo)}</td>`;
      tb.appendChild(tr);
    });
    atualizarSaldoOut(parseFloat(document.getElementById('saldo').value)||0);
    atualizarResumo();
    atualizarSugerido50();
    atualizarETA();
  }catch(e){
    atualizarSaldoOut(parseFloat(document.getElementById('saldo').value)||0);
    atualizarResumo();
    atualizarSugerido50();
    atualizarETA();
  }
}

function atualizarSugerido50(){
  const saldo = parseFloat(document.getElementById('saldo').value)||0;
  const restantes = Math.max(1, 50 - parcelasRegistradas);
  const sugerido = saldo / restantes;
  document.getElementById('valorSugerido50').value = n2(sugerido);
}

function estimarMesesQuitacao(){
  // Projeção: parcela atual + assume extra fixo = campo "valorExtra" para meses futuros (não altera histórico).
  const saldoInicial = parseFloat(document.getElementById('saldo').value)||0;
  const taxaAnual = parseFloat(document.getElementById('taxaEfetiva').value)||0;
  const parcela = parseFloat(document.getElementById('valorParcela').value)||0;
  const extraFix = Math.max(parseFloat(document.getElementById('valorExtra').value)||0, 0);
  const i = taxaMensalEfetiva(taxaAnual);
  let s = saldoInicial;
  let m = 0;
  const MAX = 600;
  while (s > 0.005 && m < MAX){
    const juros = s * i;
    const amort = Math.max(parcela - juros, 0);
    s = s - amort - extraFix;
    if(s < 0) s = 0;
    m++;
  }
  return m;
}

function atualizarETA(){
  const meses = estimarMesesQuitacao();
  const anos = Math.floor(meses/12);
  const rem = meses % 12;
  const el = document.getElementById('etaBanner');
  el.textContent = `Tempo estimado para quitação: ${meses} meses (${anos} anos e ${rem} meses)`;
}

window.onload = ()=>{
  carregarLocal();
};
