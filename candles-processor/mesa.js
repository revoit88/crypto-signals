module.exports = hl2 => {
  const fl = 0.5;
  const sl = 0.05;
  /**
   *
   * @param {Number} v value
   * @return {Number}
   */
  const nz = v => (isNaN(v) ? 0 : v);

  const fillWithZeros = o => {
    return Object.keys(o).reduce((acc, key) => {
      return { ...acc, [key]: o[key].concat(0) };
    }, {});
  };

  const compute = (a, p) =>
    (0.0962 * a[0] +
      0.5769 * nz(a[2]) -
      0.5769 * nz(a[4]) -
      0.0962 * nz(a[6])) *
    (0.075 * nz(p) + 0.54);

  const mesa = hl2.reduce(
    (acc, current, index, array) => {
      if (index <= 4) {
        return fillWithZeros(acc);
      }

      const previousPrices = array.slice(0, index).slice(-7).reverse();

      const currentSmooth =
        (4 * current +
          3 * nz(previousPrices[0]) +
          2 * nz(previousPrices[1]) +
          nz(previousPrices[2])) /
        10;
      const smooth = [currentSmooth].concat(acc.smooth);
      const previousPeriod = acc.period.slice(-1);
      const currentDetrender = compute(smooth, previousPeriod);
      const detrender = [currentDetrender].concat(acc.detrender);

      // Compute InPhase and Quadrature components
      const currentQ1 = compute(detrender, previousPeriod);
      const q1 = [currentQ1].concat(acc.q1);

      const currentI1 = detrender[3];
      const i1 = [currentI1].concat(acc.i1);

      // Advance the phase of I1 and Q1 by 90 degrees
      const currentJi = compute(i1, previousPeriod);
      const jI = [currentJi].concat(acc.jI);

      const currentJq = compute(q1, previousPeriod);
      const jQ = [currentJq].concat(acc.jQ);

      // Phasor addition for 3 bar averaging
      const currentI2 = currentI1 - currentJq;
      const i2 = [currentI2].concat(acc.i2);
      const currentQ2 = currentQ1 + currentJi;
      const q2 = [currentQ2].concat(acc.q2);

      // Smooth the I and Q components before applying the discriminator
      const smoothedI2 = 0.2 * currentI2 + 0.8 * nz(i2[1]);
      const smoothedQ2 = 0.2 * currentQ2 + 0.8 * nz(q2[1]);

      // Homodyne Discriminator
      const re_ = smoothedI2 * nz(i2[1]) + smoothedQ2 * nz(q2[1]);
      const im_ = smoothedI2 * nz(q2[1]) - smoothedQ2 * nz(i2[1]);

      const re = 0.2 * re_ + 0.8 * nz(acc.re[0]);
      const im = 0.2 * im_ + 0.8 * nz(acc.im[0]);

      let currentPeriod = 0;
      if (im !== 0 && re !== 0) {
        currentPeriod = (2 * Math.PI) / Math.atan(im / re);
      } else {
        currentPeriod = nz(acc.period[0]);
      }
      if (currentPeriod > 1.5 * nz(acc.period[0])) {
        currentPeriod = 1.5 * nz(acc.period[0]);
      }
      if (currentPeriod < 0.67 * nz(acc.period[0])) {
        currentPeriod = 0.67 * nz(acc.period[0]);
      }
      if (currentPeriod < 6) {
        currentPeriod = 6;
      }
      if (currentPeriod > 50) {
        currentPeriod = 50;
      }

      const period = 0.2 * currentPeriod + 0.8 * nz(acc.period[0]);
      const smoothPeriod = 0.33 * period + 0.67 * nz(acc.smoothPeriod[0]);

      const phase = (180 / Math.PI) * Math.atan(currentQ1 / currentI1);

      let deltaPhase = nz(acc.phase[0]) - phase;

      if (deltaPhase < 1) {
        deltaPhase = 1;
      }

      let alpha = fl / deltaPhase;

      if (alpha < sl) {
        alpha = sl;
      }

      const mama = alpha * current + (1 - alpha) * nz(acc.mama[0]);
      const fama = 0.5 * alpha * mama + (1 - 0.5 * alpha) * nz(acc.fama[0]);
      return {
        smooth,
        detrender,
        i1,
        q1,
        jI,
        jQ,
        i2,
        q2,
        re: [re].concat(acc.re),
        im: [im].concat(acc.im),
        period: [period].concat(acc.period),
        smoothPeriod: [smoothPeriod].concat(acc.smoothPeriod),
        phase: [phase].concat(acc.phase),
        deltaPhase: [deltaPhase].concat(acc.deltaPhase),
        alpha: [alpha].concat(acc.alpha),
        mama: [mama].concat(acc.mama),
        fama: [fama].concat(acc.fama)
      };
    },
    {
      smooth: [],
      detrender: [],
      i1: [],
      q1: [],
      jI: [],
      jQ: [],
      i2: [],
      q2: [],
      re: [],
      im: [],
      period: [],
      smoothPeriod: [],
      phase: [],
      deltaPhase: [],
      alpha: [],
      mama: [],
      fama: []
    }
  );

  return {
    mama: nz(mesa.mama[0]),
    fama: nz(mesa.fama[0])
  };
};
