(function () {
  if (window.location.hostname !== 'photon-sol.tinyastro.io') return;

  let allWalletStats = {};
  const statsDiv = dom.createStatsDiv();
  
  const targetSection = document.querySelector('.p-show__widget.p-show__pair.u-py-s-lg');
  if (targetSection) {
    targetSection.appendChild(statsDiv);
  }

  let processedTransactions = new Set();

  let updateCounter = 0;
  let lastUpdateTime = Date.now();

  function updateWalletStats() {
    updateCounter++;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    lastUpdateTime = now;

    const statsList = document.getElementById('wallet-stats-list');
    if (!statsList) {
      setTimeout(updateWalletStats, 1000);
      return;
    }

    const rows = document.querySelectorAll('.c-grid-table__tr');
    
    rows.forEach((row) => {
      const type = row.querySelectorAll('.c-grid-table__td')[1]?.textContent?.trim();
      const walletLink = row.querySelector('.c-grid-table__td a')?.href;
      const wallet = walletLink ? walletLink.split('/account/')[1] : null;
      const solAmount = parseFloat(
        row.querySelector('.c-grid-table__td:nth-child(5)')?.textContent?.replace(/₆|₃|,/g, '') || 0
      );
      
      const txId = row.querySelector('.c-grid-table__td:nth-child(1)')?.textContent?.trim();

      if (!wallet || !solAmount || !txId) {
        return;
      }

      if (!processedTransactions.has(txId)) {
        processedTransactions.add(txId);

        if (!allWalletStats[wallet]) {
          allWalletStats[wallet] = { buys: 0, sells: 0, buyAmount: 0, sellAmount: 0 };
        }

        if (type.toLowerCase().includes('buy')) {
          allWalletStats[wallet].buys++;
          allWalletStats[wallet].buyAmount += solAmount;
        } else if (type.toLowerCase().includes('sell')) {
          allWalletStats[wallet].sells++;
          allWalletStats[wallet].sellAmount += solAmount;
        }
      }
    });

    const sortedStats = Object.entries(allWalletStats)
      .map(([wallet, data]) => ({
        wallet,
        data,
        threat: walletStats.getWalletThreatLevel(data)
      }))
      .filter(entry => entry.threat !== null)
      .sort((a, b) => (b.data.buyAmount + b.data.sellAmount) - (a.data.buyAmount + a.data.sellAmount))
      .slice(0, 6);

    const projectRisk = walletStats.calculateProjectRisk(allWalletStats);
    const totalScammerWins = walletStats.calculateTotalScammerWins(sortedStats);
    
    const headerDiv = document.querySelector('.js-info h6');
    if (headerDiv) {
      headerDiv.innerHTML = `
        Pump & Dump Detection
        <div style="font-size: 11px; margin-top: 4px;">

          <div style="text-align: center; margin: 10px 0; width: 100%;">
            <button class="c-btn c-btn--sm u-ml-xs" id="filter-bots-btn">
              Filter Bot Txs
            </button> 
          </div>
          <div style="margin-top: 10px; margin-bottom: 10px;">
            <span class="${projectRisk.riskClass}">
              ${projectRisk.riskIcon} Project Risk: ${projectRisk.totalTxs > 20 ? projectRisk.riskLevel : 'Calculating...'}
            </span>
            <br/>
            <span style="color: #888;">
              Genuine Trades: ${projectRisk.genuineTxs} | Suspicious: ${projectRisk.susTxs}
            </span>
          </div>
          <span class="u-color-red">Potential Scammer Earnings: ${totalScammerWins.toFixed(2)} SOL</span>
          <br/>
          <span style="font-size: 16px; margin-top: 10px; display: block;">
            Top 6 Offenders: <br /><span style="font-size: 10px;">(last updated ${new Date().toLocaleTimeString()})</span>
          </span>
        </div>
      `;

      // Reattach event listener since innerHTML replacement removes it
      const filterBtn = document.getElementById('filter-bots-btn');
      if (filterBtn) {
        filterBtn.addEventListener('click', () => {
          const filterBtn = document.querySelector('.c-grid-table__th:nth-child(7) .c-icon[data-icon="filter"]');
          if (filterBtn) filterBtn.click();

          setTimeout(() => {
            const minInput = document.querySelector('.c-modal__content input[placeholder="min"]');
            if (minInput) {
              minInput.value = '0.001';
              minInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              const applyBtn = document.querySelector('.c-modal__content .l-row-gap--xxs > div:nth-child(2) button');
              if (applyBtn) applyBtn.click();
            }
          }, 100);
        });
      }
    }

    // Render stats
    statsList.innerHTML = sortedStats.length === 0 
      ? `<div class="l-row l-row-gap--l u-mt-s">
           <div class="l-col">
             <div class="c-info__cell u-font-size-zh-3xs u-text-center">
               <span style="color: #4CAF50">✅ No suspicious activity detected so far</span>
             </div>
           </div>
         </div>`
      : sortedStats
          .map(({wallet, data, threat}) => {
            const tokenFlow = data.buyAmount - data.sellAmount;
            const profitLoss = data.sellAmount - data.buyAmount;
            return dom.renderWalletStats(wallet, data, threat, tokenFlow, profitLoss);
          })
          .join('');
  }

  setInterval(updateWalletStats, 1000);
})();