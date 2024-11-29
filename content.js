(function () {
  if (window.location.hostname === 'photon-sol.tinyastro.io') {
    let allWalletStats = {};
    const statsDiv = document.createElement('div');
    statsDiv.id = 'wallet-stats';
    statsDiv.className = 'p-show__widget p-show__info u-p-0 u-mb-xs u-mb-0-lg';
    statsDiv.style.marginTop = '20px';
    
    statsDiv.innerHTML = `
      <div class="c-info js-info">
        <h6 class="u-font-size-zh-3xs u-p-xs">Potentially Pump & Dump</h6>
        <div class="c-info__content js-info__content">
          <div id="wallet-stats-list"></div>
        </div>
      </div>
    `;

    const targetSection = document.querySelector('.p-show__widget.p-show__pair.u-py-s-lg');
    if (targetSection) {
      targetSection.appendChild(statsDiv);
    }

    function updateWalletStats() {
      const rows = document.querySelectorAll('.c-grid-table__tr');
      
      rows.forEach((row) => {
        const type = row.querySelectorAll('.c-grid-table__td')[1]?.textContent?.trim();
        const wallet = row.querySelector('.c-grid-table__td a')?.textContent?.trim();
        const solAmount = parseFloat(
          row.querySelector('.c-grid-table__td:nth-child(5)')?.textContent?.replace(/₆|₃|,/g, '') || 0
        );

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
        .sort((a, b) => {
          const totalA = a[1].buyAmount + a[1].sellAmount;
          const totalB = b[1].buyAmount + b[1].sellAmount;
          return totalB - totalA;
        })
        .slice(0, 10); 

      const statsList = document.getElementById('wallet-stats-list');
      statsList.innerHTML = sortedStats
        .map(([wallet, data]) => {
          const totalVolume = data.buyAmount + data.sellAmount;
          const netPosition = data.buyAmount - data.sellAmount;
          const netPositionClass = netPosition >= 0 ? 'u-color-green' : 'u-color-red';
          const netPositionSign = netPosition >= 0 ? '+' : '';
          
          return `
            <div class="l-row l-row-gap--l u-mt-s">
              <div class="l-col">
                <div class="c-info__cell u-font-size-zh-3xs">
                  <div class="l-row u-justify-content-between">
                    <div class="l-col-auto">
                      ${wallet.substring(0, 5)}...${wallet.substring(wallet.length - 4)}
                    </div>
                    <div class="l-col-auto ${netPositionClass}">
                      ${netPositionSign}${netPosition.toFixed(2)} SOL
                    </div>
                  </div>
                  <div class="l-row u-justify-content-between">
                    <div class="l-col-auto">
                      <div class="c-info__cell u-font-size-zh-3xs">
                        Buys
                        <div class="c-info__cell__value u-color-green">${data.buys} (${data.buyAmount.toFixed(2)} SOL)</div>
                      </div>
                    </div>
                    <div class="l-col-auto">
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
              </div>
            </div>
          `;
        }).join('');
    }

    setInterval(updateWalletStats, 1000);
  }
})();
  