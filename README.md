# ROSELY v29 — Tabela vazia (estilo v24) + Sugerido 50m + ETA

- **Campo Sugerido (50 meses)**: saldo / (50 − parcelas já registradas). Atualiza após cada confirmação.
- **ETA de quitação**: simula meses restantes usando parcela atual e **assume extra fixo = campo 'Valor de amortização extra'** para a projeção (não altera histórico).
- **Tabela acumulativa**: cada pagamento gera nova linha; tudo salvo no navegador.
- **Botões**: Confirmar parcela, Confirmar amortização (mensal/pontual), Desfazer, Resetar, Exportar CSV.
- **Cálculos**:
  - i_mensal = (1+i_anual)^(1/12) − 1
  - juros = saldo × i_mensal
  - amort = max(parcela − juros, 0)
  - saldo_novo = saldo − amort − extra
