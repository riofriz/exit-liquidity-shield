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
        <div style="text-align: center; width: 100%; margin-bottom: 10px;">
          Pump & Dump Detection <br />
          <span class="u-color-red" style="font-size: 10px;">Potential Scammer Earnings: ${totalScammerWins.toFixed(2)} SOL</span>
        </div>
        <div style="font-size: 11px; margin: 20px 0 0 0; text-align: left;">
          <div style="text-align: center; margin: 10px 0; width: 100%; display: flex; gap: 8px; justify-content: center;">
            <button style="
              padding: 6px 12px;
              font-size: 11px;
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(255, 255, 255, 0.05);
              color: #fff;
              cursor: pointer;
              transition: all 0.2s;
              &:hover {
                background: rgba(255, 255, 255, 0.1);
              }
            " id="filter-bots-btn">
              Filter Bot Txs
            </button> 
            <button style="
              padding: 6px 12px;
              font-size: 11px;
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(255, 255, 255, 0.05);
              color: #fff;
              cursor: pointer;
              transition: all 0.2s;
              &:hover {
                background: rgba(255, 255, 255, 0.1);
              }
            " id="filter-whales-btn">
              Expose Whales
            </button>
          </div>
          <div style="margin-top: 20px; margin-bottom: 10px;">
            <span class="${projectRisk.riskClass}">
              ${projectRisk.riskIcon} Project Risk: ${projectRisk.totalTxs > 20 ? projectRisk.riskLevel : 'Calculating...'}
            </span>
            <br/>
            <span style="color: #888;">
              Genuine Trades: ${projectRisk.genuineTxs} | Suspicious: ${projectRisk.susTxs}
            </span>
          </div>
          <br/>
          ${bigWhales.length > 0 ?
          `<div class="c-info__cell u-font-size-zh-3xs" style="margin: 10px 0;border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px;">
              <span class="u-color-red">Whale Dumpers:</span><br /><br/>
              <div style="max-height: 150px; overflow-y: auto;">
                ${bigWhales.map(whale => `
                  <div style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
                  <span style="cursor: pointer;" onclick="navigator.clipboard.writeText('${whale.wallet}')">📋 ${whale.wallet.substring(0, 4)}...${whale.wallet.substring(whale.wallet.length - 3)}</span>
                  <span>${whale.solAmount} SOL</span>
                </div>
              `).join('')}
              </div>
            </div>`
          : ''
        }
          <span style="font-size: 16px; margin-top: 20px; display: block;">
            Top 6 Offenders: <br/>
            <span style="font-size: 10px;">(last updated ${new Date().toLocaleTimeString()})</span>
          </span>
        </div>
      `;

      // Reattach event listeners since innerHTML replacement removes them
      const filterBtn = document.getElementById('filter-bots-btn');
      const whalesBtn = document.getElementById('filter-whales-btn');

      const setupFilterClick = (btn, minAmount) => {
        if (btn) {
          btn.addEventListener('click', () => {
            const filterBtn = document.querySelector('.c-grid-table__th:nth-child(7) .c-icon[data-icon="filter"]');
            if (filterBtn) filterBtn.click();

            setTimeout(() => {
              const minInput = document.querySelector('.c-modal__content input[placeholder="min"]');
              if (minInput) {
                minInput.value = minAmount;
                minInput.dispatchEvent(new Event('input', { bubbles: true }));

                const applyBtn = document.querySelector('.c-modal__content .l-row-gap--xxs > div:nth-child(2) button');
                if (applyBtn) applyBtn.click();
              }
            }, 100);
          });
        }
      };

      setupFilterClick(filterBtn, '0.001');
      setupFilterClick(whalesBtn, '10');
    }

    // Render stats
    statsList.innerHTML = sortedStats.length === 0
      ? `<div class="l-row l-row-gap--l u-mt-s" style="margin-bottom: 0!important">
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