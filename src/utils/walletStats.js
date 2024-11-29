const walletStats = {
  getWalletThreatLevel(data) {
    const tradeCount = data.buys + data.sells;
    
    if (tradeCount > 10) {
      return {
        level: 'high',
        icon: '🚨',
        class: 'u-color-red',
        message: 'High risk: Very active trading pattern'
      };
    }
    
    if (tradeCount > 6) {
      return {
        level: 'medium',
        icon: '⚠️',
        class: 'u-color-orange',
        message: 'Medium risk: Increased trading activity'
      };
    }
    
    if (tradeCount > 3) {
      return {
        level: 'low',
        icon: '👀',
        class: 'u-color-green',
        message: 'Low risk: Normal trading activity'
      };
    }
  
    return null;
  },
  
  calculateTotalScammerWins(stats) {
    return stats.reduce((total, {data}) => {
      const profit = data.sellAmount - data.buyAmount;
      return total + (profit > 0 ? profit : 0);
    }, 0);
  }
};