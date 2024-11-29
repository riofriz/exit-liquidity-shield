(function () {
  if (window.location.hostname !== 'photon-sol.tinyastro.io') return;

  let allWalletStats = {};
  const statsDiv = dom.createStatsDiv();
  
  const targetSection = document.querySelector('.p-show__widget.p-show__pair.u-py-s-lg');
  if (targetSection) {
    targetSection.appendChild(statsDiv);
  }

  function updateWalletStats() {
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

      if (wallet && solAmount) {
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
      .slice(0, 10);

    const totalScammerWins = walletStats.calculateTotalScammerWins(sortedStats);
    
    // Update header with total wins
    const headerDiv = document.querySelector('.js-info h6');
    if (headerDiv) {
      headerDiv.innerHTML = `
        Pump & Dump Detection
        <div style="font-size: 11px; margin-top: 4px;">
          <span class="u-color-red">Total Scammer Wins: ${totalScammerWins.toFixed(2)} SOL</span>
        </div>
      `;
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