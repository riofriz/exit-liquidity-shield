(function () {
  if (window.location.hostname === 'photon-sol.tinyastro.io') {
    let allWalletStats = {};
    const statsDiv = document.createElement('div');
    statsDiv.id = 'wallet-stats';
    statsDiv.className = 'p-show__widget p-show__info u-p-0 u-mb-xs u-mb-0-lg';
    statsDiv.style.marginTop = '20px';
    
    statsDiv.innerHTML = `
      <div class="c-info js-info">
        <h6 class="u-font-size-zh-3xs u-p-xs">Pump & Dump Detection</h6>
        <div class="c-info__content js-info__content">
          <div id="wallet-stats-list"></div>
        </div>
      </div>
    `;

    const targetSection = document.querySelector('.p-show__widget.p-show__pair.u-py-s-lg');
    if (targetSection) {
      targetSection.appendChild(statsDiv);
    }

    function getWalletThreatLevel(data) {
      const tradeCount = data.buys + data.sells;
      
      if (tradeCount > 15) {
        return {
          level: 'high',
          icon: '🚨',
          class: 'u-color-red',
          message: 'High risk: Very active trading pattern'
        };
      }
      
      if (tradeCount > 8) {
        return {
          level: 'medium',
          icon: '⚠️',
          class: 'u-color-orange',
          message: 'Medium risk: Increased trading activity'
        };
      }
      
      if (tradeCount > 5) {
        return {
          level: 'low',
          icon: '👀',
          class: 'u-color-green',
          message: 'Low risk: Normal trading activity'
        };
      }

      return null;
    }

    function updateWalletStats() {
      const statsList = document.getElementById('wallet-stats-list');
      if (!statsList) {
        console.log('Stats list element not found, retrying in 1 second...');
        setTimeout(updateWalletStats, 1000);
        return;
      }

      const list = document.getElementById('wallet-stats-list');
      if (!list) {
        console.log('Stats list element not found, retrying in 1 second...');
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

        console.log('Full wallet address:', wallet);

        if (wallet && solAmount) {
          if (!allWalletStats[wallet]) {
            allWalletStats[wallet] = {
              buys: 0,
              sells: 0,
              buyAmount: 0,
              sellAmount: 0,
              firstSeen: Date.now(),
              lastSeen: Date.now()
            };
          }

          if (type.toLowerCase().includes('buy')) {
            allWalletStats[wallet].buys++;
            allWalletStats[wallet].buyAmount += solAmount;
          } else if (type.toLowerCase().includes('sell')) {
            allWalletStats[wallet].sells++;
            allWalletStats[wallet].sellAmount += solAmount;
          }
          
          allWalletStats[wallet].lastSeen = Date.now();
        }
      });

      const sortedStats = Object.entries(allWalletStats)
        .map(([wallet, data]) => ({
          wallet,
          data,
          threat: getWalletThreatLevel(data)
        }))
        .filter(entry => entry.threat !== null)
        .sort((a, b) => {
          const totalA = a.data.buyAmount + a.data.sellAmount;
          const totalB = b.data.buyAmount + b.data.sellAmount;
          return totalB - totalA;
        })
        .slice(0, 10);

      // Calculate total scammer profits
      const totalScammerWins = sortedStats.reduce((total, {data}) => {
        const profit = data.sellAmount - data.buyAmount;
        return total + (profit > 0 ? profit : 0);
      }, 0);

      // Update the header to include total wins
      const headerDiv = document.querySelector('.js-info h6');
      if (headerDiv) {
        headerDiv.innerHTML = `
          Potentially Pump & Dump
          <div style="font-size: 11px; margin-top: 4px;">
            <span class="u-color-red">Total Scammers Wins: ${totalScammerWins.toFixed(2)} SOL</span>
          </div>
        `;
      }

      if (sortedStats.length === 0) {
        statsList.innerHTML = `
          <div class="l-row l-row-gap--l u-mt-s">
            <div class="l-col">
              <div class="c-info__cell u-font-size-zh-3xs u-text-center">
                <span style="color: #4CAF50">✅ No suspicious activity detected so far</span>
              </div>
            </div>
          </div>
        `;
        return;
      }

      statsList.innerHTML = sortedStats
        .map(({wallet, data, threat}) => {
          const totalVolume = data.buyAmount + data.sellAmount;
          const tokenFlow = data.buyAmount - data.sellAmount;
          const profitLoss = data.sellAmount - data.buyAmount;

          const tokenFlowClass = tokenFlow >= 0 ? 'u-color-green' : 'u-color-red';
          const plClass = profitLoss >= 0 ? 'u-color-green' : 'u-color-red';
          const tokenFlowSign = tokenFlow >= 0 ? '+' : '';
          const plSign = profitLoss >= 0 ? '+' : '';

          console.log('Full wallet address:', wallet);
          console.log('Truncated address:', `${wallet.substring(0, 4)}...${wallet.substring(wallet.length - 3)}`);

          return `
            <div class="l-row l-row-gap--l u-mt-s">
              <div class="l-col">
                <div class="c-info__cell u-font-size-zh-3xs">
                  <div class="l-row u-justify-content-between" style="align-items: center;">
                    <div class="l-col-auto" style="flex: 1;">
                      ${threat.icon} <span class="${threat.class}" title="${wallet}">${wallet.substring(0, 4)}...${wallet.substring(wallet.length - 3)}</span>
                    </div>
                    <div class="l-col-auto" style="flex: 1; text-align: right;">
                      <span title="Token Flow">🔄 <span class="${tokenFlowClass}">${tokenFlowSign}${tokenFlow.toFixed(2)}</span></span><br />
                      <span title="Profit/Loss">💰 Scammer ${profitLoss >= 0 ? 'wins' : 'accumulating'}: <span class="${plClass}">${plSign}${Math.abs(profitLoss).toFixed(2)}</span></span>
                    </div>
                  </div>
                  <div class="l-row u-justify-content-between" style="margin-top: 8px;">
                    <div class="l-col-auto" style="flex: 1;">
                      <div class="c-info__cell u-font-size-zh-3xs">
                        Buys
                        <div class="c-info__cell__value u-color-green">${data.buys} (${data.buyAmount.toFixed(2)} SOL)</div>
                      </div>
                    </div>
                    <div class="l-col-auto" style="flex: 1; text-align: right;">
                      <div class="c-info__cell u-text-right u-font-size-zh-3xs">
                        Sells
                        <div class="c-info__cell__value u-color-red">${data.sells} (${data.sellAmount.toFixed(2)} SOL)</div>
                      </div>
                    </div>
                  </div>
                  <div class="l-row l-row-gap--4xs u-mt-3xs">
                    <div class="l-col js-info__line__green" style="flex: 0 0 ${(data.buyAmount / totalVolume * 100).toFixed(2)}%;">
                      <div class="c-info__line c-info__line--green"></div>
                    </div>
                    <div class="l-col js-info__line__red" style="flex: 0 0 ${(data.sellAmount / totalVolume * 100).toFixed(2)}%;">
                      <div class="c-info__line"></div>
                    </div>
                  </div>
                </div>
                <div class="l-row">
                  <div class="l-col">
                    <small style="font-size: 10px" class="${threat.class}">${threat.message}</small>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
    }

    setInterval(updateWalletStats, 1000);
  }
})();
  