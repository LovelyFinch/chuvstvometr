/**
 * GaugeRenderer — SVG-спидометр для Чувствометра.
 * Отрисовывает полукруглый спидометр с 7 цветными секторами и анимированной стрелкой.
 */
class GaugeRenderer {
  /**
   * @param {string} containerId - ID контейнера для SVG
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.needle = null;
    this.currentLevel = 1;

    // SVG dimensions
    this.cx = 200;       // center X
    this.cy = 190;       // center Y (near bottom of viewBox)
    this.outerR = 170;   // outer radius of gauge arc
    this.innerR = 100;   // inner radius (donut shape)
    this.needleLength = 155; // needle length

    // Gauge spans from 180° (left) to 0° (right)
    this.startAngle = 180;
    this.endAngle = 0;
    this.totalAngle = 180;
    this.sectorAngle = this.totalAngle / CONFIG.LEVELS.length; // ~25.7°
  }

  /**
   * Создаёт и рендерит SVG-спидометр в контейнер.
   */
  render() {
    if (!this.container) {
      console.error(`GaugeRenderer: container #${this.containerId} not found`);
      return;
    }

    // Create SVG element
    const svgNS = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(svgNS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 400 220');
    this.svg.setAttribute('xmlns', svgNS);
    this.svg.classList.add('gauge-svg');

    // Draw sectors
    CONFIG.LEVELS.forEach((levelInfo, index) => {
      const sectorStart = this.startAngle - index * this.sectorAngle;
      const sectorEnd = sectorStart - this.sectorAngle;
      const path = this._createArcPath(sectorStart, sectorEnd, levelInfo.hex, levelInfo.level);
      this.svg.appendChild(path);
    });

    // Draw sector dividers (thin white lines)
    CONFIG.LEVELS.forEach((_, index) => {
      if (index > 0) {
        const angle = this.startAngle - index * this.sectorAngle;
        const line = this._createDividerLine(angle);
        this.svg.appendChild(line);
      }
    });

    // Draw level numbers on sectors
    CONFIG.LEVELS.forEach((levelInfo, index) => {
      const midAngle = this.startAngle - (index + 0.5) * this.sectorAngle;
      const label = this._createSectorLabel(midAngle, levelInfo.level);
      this.svg.appendChild(label);
    });

    // Draw needle
    this.needle = this._createNeedle();
    this.svg.appendChild(this.needle);

    // Draw center circle (needle pivot)
    const centerCircle = document.createElementNS(svgNS, 'circle');
    centerCircle.setAttribute('cx', String(this.cx));
    centerCircle.setAttribute('cy', String(this.cy));
    centerCircle.setAttribute('r', '12');
    centerCircle.setAttribute('fill', '#ffffff');
    centerCircle.setAttribute('stroke', '#333');
    centerCircle.setAttribute('stroke-width', '2');
    this.svg.appendChild(centerCircle);

    this.container.appendChild(this.svg);

    // Set initial needle position
    this._updateNeedle(this.currentLevel, false);
  }

  /**
   * Анимированно перемещает стрелку на указанный уровень.
   * @param {number} level - уровень 1-7
   */
  setLevel(level) {
    if (level < 1 || level > CONFIG.LEVELS.length) {
      console.warn(`GaugeRenderer: invalid level ${level}`);
      return;
    }
    this.currentLevel = level;
    this._updateNeedle(level, true);
  }

  /**
   * Обновляет текстовую подпись уровня.
   * @param {string} color - название цвета
   * @param {string} hex - HEX-код цвета
   */
  updateLabel(color, hex) {
    const levelText = document.getElementById('level-text');
    if (levelText) {
      levelText.textContent = `Уровень чувств: ${color}`;
      levelText.style.color = hex;
      // Add text shadow for white color visibility
      if (hex === '#F5F5F5') {
        levelText.style.textShadow = '0 0 8px rgba(0,0,0,0.8)';
      } else {
        levelText.style.textShadow = `0 0 12px ${hex}`;
      }
    }
  }

  /**
   * Вычисляет угол стрелки для данного уровня (в градусах, от оси X).
   * @param {number} level - уровень 1-7
   * @returns {number} угол в градусах
   */
  _calculateAngle(level) {
    // Level 1 → 180° (left), Level 7 → 0° (right)
    // Needle points to middle of sector
    const sectorIndex = level - 1;
    const midAngle = this.startAngle - (sectorIndex + 0.5) * this.sectorAngle;
    return midAngle;
  }

  /**
   * Обновляет позицию стрелки.
   * @param {number} level - уровень 1-7
   * @param {boolean} animate - использовать анимацию
   */
  _updateNeedle(level, animate) {
    if (!this.needle) return;

    const angle = this._calculateAngle(level);
    const rad = (angle * Math.PI) / 180;
    const x2 = this.cx + this.needleLength * Math.cos(rad);
    const y2 = this.cy - this.needleLength * Math.sin(rad);

    if (animate) {
      this.needle.style.transition = `all ${CONFIG.ANIMATION_DURATION}ms ease-in-out`;
    } else {
      this.needle.style.transition = 'none';
    }

    this.needle.setAttribute('x2', String(x2));
    this.needle.setAttribute('y2', String(y2));

    // Update needle color to match current level
    const levelInfo = CONFIG.LEVELS[level - 1];
    if (levelInfo) {
      const needleColor = levelInfo.hex === '#F5F5F5' ? '#cccccc' : levelInfo.hex;
      this.needle.setAttribute('stroke', needleColor);
    }
  }

  /**
   * Создаёт SVG-путь для сектора дуги.
   * @param {number} startAngle - начальный угол (градусы)
   * @param {number} endAngle - конечный угол (градусы)
   * @param {string} color - HEX-цвет сектора
   * @param {number} level - номер уровня (для data-атрибута)
   * @returns {SVGPathElement}
   */
  _createArcPath(startAngle, endAngle, color, level) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(svgNS, 'path');

    const d = this._describeArc(
      this.cx, this.cy,
      this.outerR, this.innerR,
      startAngle, endAngle
    );

    path.setAttribute('d', d);
    path.setAttribute('fill', color);
    path.setAttribute('stroke', '#1a1a2e');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('data-level', String(level));
    path.classList.add('gauge-sector');

    return path;
  }

  /**
   * Создаёт разделительную линию между секторами.
   * @param {number} angle - угол линии (градусы)
   * @returns {SVGLineElement}
   */
  _createDividerLine(angle) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const line = document.createElementNS(svgNS, 'line');

    const rad = (angle * Math.PI) / 180;
    const x1 = this.cx + this.innerR * Math.cos(rad);
    const y1 = this.cy - this.innerR * Math.sin(rad);
    const x2 = this.cx + this.outerR * Math.cos(rad);
    const y2 = this.cy - this.outerR * Math.sin(rad);

    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', '#1a1a2e');
    line.setAttribute('stroke-width', '2');

    return line;
  }

  /**
   * Создаёт текстовую метку номера уровня на секторе.
   * @param {number} angle - угол середины сектора (градусы)
   * @param {number} level - номер уровня
   * @returns {SVGTextElement}
   */
  _createSectorLabel(angle, level) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const text = document.createElementNS(svgNS, 'text');

    const labelR = (this.outerR + this.innerR) / 2; // middle of arc
    const rad = (angle * Math.PI) / 180;
    const x = this.cx + labelR * Math.cos(rad);
    const y = this.cy - labelR * Math.sin(rad);

    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5)); // +5 for vertical centering
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', level === 2 ? '#333333' : '#ffffff');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.textContent = String(level);

    return text;
  }

  /**
   * Создаёт SVG-стрелку спидометра.
   * @returns {SVGLineElement}
   */
  _createNeedle() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const needle = document.createElementNS(svgNS, 'line');

    needle.setAttribute('x1', String(this.cx));
    needle.setAttribute('y1', String(this.cy));
    needle.setAttribute('x2', String(this.cx - this.needleLength)); // initial: pointing left (level 1)
    needle.setAttribute('y2', String(this.cy));
    needle.setAttribute('stroke', '#9E9E9E');
    needle.setAttribute('stroke-width', '4');
    needle.setAttribute('stroke-linecap', 'round');
    needle.classList.add('gauge-needle');

    return needle;
  }

  /**
   * Вычисляет SVG-путь для дуги (сектора кольца).
   * @param {number} cx - центр X
   * @param {number} cy - центр Y
   * @param {number} outerR - внешний радиус
   * @param {number} innerR - внутренний радиус
   * @param {number} startAngle - начальный угол (градусы)
   * @param {number} endAngle - конечный угол (градусы)
   * @returns {string} SVG path d attribute
   */
  _describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
    const toRad = (deg) => (deg * Math.PI) / 180;

    const outerStart = {
      x: cx + outerR * Math.cos(toRad(startAngle)),
      y: cy - outerR * Math.sin(toRad(startAngle)),
    };
    const outerEnd = {
      x: cx + outerR * Math.cos(toRad(endAngle)),
      y: cy - outerR * Math.sin(toRad(endAngle)),
    };
    const innerStart = {
      x: cx + innerR * Math.cos(toRad(endAngle)),
      y: cy - innerR * Math.sin(toRad(endAngle)),
    };
    const innerEnd = {
      x: cx + innerR * Math.cos(toRad(startAngle)),
      y: cy - innerR * Math.sin(toRad(startAngle)),
    };

    const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');
  }
}
