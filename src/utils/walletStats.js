const walletStats = {
  getWalletThreatLevel(data) {
    const tradeCount = data.buys + data.sells;
    
    if (tradeCount > 8) {
      return {
        level: 'high',
        icon: '🚨',
        class: 'u-color-red',
        message: 'High risk: Multiple transactions detected!'
      };
    }
    
    if (tradeCount > 5) {
      return {
        level: 'medium',
        icon: '⚠️',
        class: 'u-color-orange',
        message: 'Medium risk: Increased transactions detected!'
      };
    }
    
    if (tradeCount > 2) {
      return {
        level: 'low',
        icon: '👀',
        class: 'u-color-yellow',
        message: 'Low risk: Normal trading activity'
      };
    }
  
    return {
      level: 'none',
      icon: '✅',
      class: 'u-color-green',
      message: 'New or minimal activity'
    };
  },
  
  calculateTotalScammerWins(stats) {
    return stats.reduce((total, entry) => {
      const profit = entry.data.sellAmount - entry.data.buyAmount;
      return total + (profit > 0 ? profit : 0);
    }, 0);
  }
};