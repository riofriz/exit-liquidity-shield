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

    if (tradeCount > 4) {
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

    return null
  },

  calculateTotalScammerWins(stats) {
    return stats.reduce((total, entry) => {
      const profit = entry.data.sellAmount - entry.data.buyAmount;
      return total + (profit > 0 ? profit : 0);
    }, 0);
  },

  calculateProjectRisk(stats) {
    let genuineTxs = 0;
    let susTxs = 0;
    let highRiskWallets = 0;

    Object.values(stats).forEach(data => {
      const totalTxs = data.buys + data.sells;
      if (totalTxs <= 2) {
        genuineTxs += totalTxs;
      } else {
        susTxs += totalTxs;
        if (totalTxs > 5) highRiskWallets++;
      }
    });

    const totalTxs = genuineTxs + susTxs;
    const susRatio = susTxs / (totalTxs || 1);

    let riskLevel;
    let riskIcon;
    let riskClass;
    if (susRatio > 0.5 && highRiskWallets > 3) {
      riskLevel = "SEVERE";
      riskIcon = "🔥";
      riskClass = "u-color-red";
    } else if (susRatio > 0.3 || highRiskWallets > 2) {
      riskLevel = "HIGH";
      riskIcon = "🚨";
      riskClass = "u-color-red";
    } else if (susRatio > 0.2) {
      riskLevel = "MEDIUM";
      riskIcon = "⚠️";
      riskClass = "u-color-orange";
    } else {
      riskLevel = "LOW";
      riskIcon = "✅";
      riskClass = "u-color-green";
    }

    return {
      totalTxs,
      genuineTxs,
      susTxs,
      riskLevel,
      riskIcon,
      riskClass,
      highRiskWallets
    };
  }
};