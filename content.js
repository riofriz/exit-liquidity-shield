(function () {
  if (window.location.hostname !== 'photon-sol.tinyastro.io') return;

  let allWalletStats = {};
  const statsDiv = dom.createStatsDiv();

  const targetSection = document.querySelector('.p-show__widget.p-show__pair.u-py-s-lg');
  if (targetSection) {
    targetSection.appendChild(statsDiv);
  }

  let processedTransactions = new Set();
  window.whaleTransactions = [];
  let whaleTransactions = window.whaleTransactions;

  function updateWalletStats() {
    const bigWhales = whaleTransactions.map(tx => ({ wallet: tx.wallet, solAmount: tx.solAmount }));

    const statsList = document.getElementById('wallet-stats-list');
    if (!statsList) {
      setTimeout(updateWalletStats, 1000);
      return;
    }

    const rows = document.querySelectorAll('.c-grid-table__tr');

    rows.forEach((row) => {
      const txId = row.getAttribute('data-uid');
      if (processedTransactions.has(txId)) {
        return;
      }

      const type = row.querySelectorAll('.c-grid-table__td')[1]?.textContent?.trim();
      const walletLink = row.querySelector('.c-grid-table__td a')?.href;
      const wallet = walletLink ? walletLink.split('/account/')[1] : null;
      const solAmount = parseFloat(
        row.querySelector('.c-grid-table__td:nth-child(7)')?.textContent?.replace(/₆|₃|,/g, '') || 0
      );

      if (parseFloat(solAmount) >= 10 && !whaleTransactions.some(tx => tx.wallet === wallet)) {
        const currentTxTime = row.querySelector('.c-grid-table__td:first-child')?.textContent;
        const isRecentTxs = Array.from(rows).filter(r => {
          const txWallet = r.querySelector('.c-grid-table__td a')?.href?.split('/account/')[1];
          if (txWallet !== wallet) return false;

          const txtime = r.querySelector('.c-grid-table__td:first-child')?.textContent;
          return (currentTxTime === txtime || currentTxTime.includes('s'));
        });

        if (isRecentTxs) {
          whaleTransactions.push({
            txId,
            wallet,
            solAmount: solAmount.toFixed(2)
          });
          console.log(`whale added to array: ${wallet} - ${solAmount}`);
        }
      }

      processedTransactions.add(txId);

      if (!wallet || !solAmount) {
        return;
      }

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
          ${bigWhales.length > 0 ?
          `<div class="c-info__cell u-font-size-zh-3xs" style="margin: 10px 0;border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px;">
              <span class="u-color-red">Whale Dumpers:</span><br /><br/>
              ${bigWhales.map(
            whale => `<div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
                  <span style="cursor: pointer;" onclick="navigator.clipboard.writeText('${whale.wallet}')">📋 ${whale.wallet.substring(0, 4)}...${whale.wallet.substring(whale.wallet.length - 3)}</span>
                  <span>${whale.solAmount} SOL</span>
                </div>`
          ).join('')}
            </div>`
          : ''
        }
          <span style="font-size: 16px; margin-top: 10px; display: block;">
            Top 6 Offenders: <br /><span style="font-size: 10px;">(last updated ${new Date().toLocaleTimeString()})</span>
      </span>
        </div >
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
        .map(({ wallet, data, threat }) => {
          const tokenFlow = data.buyAmount - data.sellAmount;
          const profitLoss = data.sellAmount - data.buyAmount;
          return dom.renderWalletStats(wallet, data, threat, tokenFlow, profitLoss);
        })
        .join('');
  }

  setInterval(updateWalletStats, 1000);
})();