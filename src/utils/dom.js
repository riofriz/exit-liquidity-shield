const dom = {
  createStatsDiv() {
    const statsDiv = document.createElement('div');
    statsDiv.id = 'wallet-stats';
    statsDiv.className = 'p-show__widget p-show__info u-p-0 u-mb-xs u-mb-0-lg';
    statsDiv.style.marginTop = '20px';
    
    statsDiv.innerHTML = `
      <div class="c-info js-info" style="padding-bottom: 1em">
        <h6 class="u-font-size-zh-3xs u-p-xs">
          Pump & Dump Detection
        </h6>
        <div class="js-info__content" style="padding: 0 0.8em;">
          <div id="wallet-stats-list"></div>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const filterBtn = document.getElementById('filter-bots-btn');
      if (filterBtn) {
        filterBtn.addEventListener('click', () => {
          const filterBtn = document.querySelector('.c-grid-table__th:nth-child(7) .c-icon[data-icon="filter"]');
          if (filterBtn) filterBtn.click();

          // Wait for modal to appear
          setTimeout(() => {
            const minInput = document.querySelector('.c-modal__content input[placeholder="min"]');
            if (minInput) {
              minInput.value = '0.001';
              minInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              const applyBtn = document.querySelector('.c-modal__content .c-btn:not(.c-btn--lt)');
              if (applyBtn) applyBtn.click();
            }
          }, 100);
        });
      }
    }, 0);
    
    return statsDiv;
  },

  renderWalletStats(wallet, data, threat, tokenFlow, profitLoss) {
    const totalVolume = data.buyAmount + data.sellAmount;
    
    return `
      <div class="l-row l-row-gap--l u-mt-s">
        <div class="l-col">
          <div class="c-info__cell u-font-size-zh-3xs" style="border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div class="l-row u-justify-content-between" style="align-items: center;">
              <div class="l-col-auto" style="flex: 1;">
                ${threat.icon} 
                <span class="${threat.class}" title="${wallet}">
                  ${wallet.substring(0, 4)}...${wallet.substring(wallet.length - 3)}
                </span>
                <span class="u-pointer u-ml-2xs" style="opacity: 0.7;" title="Copy address" onclick="navigator.clipboard.writeText('${wallet}')">📋</span>
              </div>
              <div class="l-col-auto" style="flex: 1; text-align: right;">
                <span title="Token Flow">🔄 FLOW: <span class="${tokenFlow >= 0 ? 'u-color-green' : 'u-color-red'}">${tokenFlow >= 0 ? '+' : '-'}${tokenFlow.toFixed(2)}</span></span><br />
                <span title="Profit/Loss">💰 ${profitLoss >= 0 ? 'wins' : 'buying'}: <span class="${profitLoss >= 0 ? 'u-color-green' : 'u-color-red'}">${profitLoss >= 0 ? '+' : ''}${Math.abs(profitLoss).toFixed(2)}</span></span>
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
            <div class="l-row" style="margin-top: 5px;">
              <div class="l-col">
                <small style="font-size: 10px" class="${threat.class}">${threat.message}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};