// Main application
{
  let drawTimeout;
  let R, barY, midX, oldTheme;
  let clockInfoItems, clockInfoMenu, clockInfoMenu2, clockInfoMenu3;
  let initialized = false;

  Graphics.prototype.setFont7Seg = function() {
    return this.setFont("6x8");
  };

  const initLayout = function() {
    Bangle.loadWidgets();
    R = Bangle.appRect;
    R.x += 1;
    R.y += 1;
    R.x2 -= 1;
    R.y2 -= 1;
    R.w -= 2;
    R.h -= 2;

    midX = R.x + R.w / 2;
    barY = R.y + R.h / 2;

    oldTheme = g.theme;
    g.setTheme({ bg: "#000", fg: "#fff", dark: true });
    g.clearRect(R.x, R.y, R.x2, R.y2);
    g.fillRect({ x: R.x, y: R.y, w: R.w, h: R.h, r: 8 })
      .clearRect(R.x, barY, R.w, barY + 1)
      .clearRect(midX, R.y, midX + 1, barY);
  };

  const clockInfoDraw = function(itm, info, options) {
    options = options || {};
    g.reset().setFont("6x8").setColor(g.theme.bg).setBgColor(g.theme.fg);

    if (options.focus) g.setBgColor("#FF0");

    g.clearRect({
      x: options.x || 0,
      y: options.y || 0,
      w: options.w || 0,
      h: options.h || 0,
      r: 8
    });

    if (info && info.img) g.drawImage(info.img, (options.x || 0) + 4, (options.y || 0) + 4);

    const title = itm && itm.name;
    const text = info && info.text ? info.text.toString() : "";

    if (title && !title.includes("Bangle")) {
      g.setFontAlign(1, 0)
        .drawString(title, (options.x || 0) + (options.w || 0) - 4, (options.y || 0) + 10);
    }

    if (g.setFont("Vector", 18).stringWidth(text) + 8 > (options.w || 0)) {
      g.setFont("6x8");
    } else {
      g.setFont("Vector", 18);
    }

    g.setFontAlign(0, 0).drawString(text, (options.x || 0) + (options.w || 0) / 2, (options.y || 0) + 40);
  };

  const draw = function() {
    if (!R || !initialized) return;

    g.reset().setColor(g.theme.bg).setBgColor(g.theme.fg);
    g.clearRect(R.x, barY + 2, R.x2, R.y2 - 8);

    if (clockInfoMenu && clockInfoMenu.draw) clockInfoMenu.draw();
    if (clockInfoMenu2 && clockInfoMenu2.draw) clockInfoMenu2.draw();
    if (clockInfoMenu3 && clockInfoMenu3.draw) clockInfoMenu3.draw();

    drawTimeout = setTimeout(draw, 60000 - (Date.now() % 60000));
  };

  const initClockInfo = function() {
    // Load clock_info first
    clockInfoItems = require("clock_info").load();
    
    // Add Distance item
    clockInfoItems.push({
      name: "Distance",
      get: function() {
        try {
          const stepData = Bangle.getHealthStatus("day").steps;
          const distance = (stepData * 0.000397727).toFixed(2);
          return {
            text: distance + " mi",
            img: require("heatshrink").decompress(atob("gEAkFQgEEhkAhkMgEIgOAhEDwEIgeghEHwEIhEghEJhUIhUKiEKjEShkM"))
          };
        } catch(e) {
          return { text: "0.00 mi" };
        }
      },
      show: function() {
        this.interval = setTimeout(() => {
          this.emit("redraw");
          this.interval = setInterval(() => {
            this.emit("redraw");
          }, 60000);
        }, 60000 - (Date.now() % 60000));
      },
      hide: function() {
        clearInterval(this.interval);
        this.interval = undefined;
      }
    });

    const clockInfo = require("clock_info");
    
    clockInfoMenu = clockInfo.addInteractive(clockInfoItems, {
      app: "meander",
      x: R.x,
      y: R.y,
      w: midX - 2,
      h: barY - R.y,
      draw: clockInfoDraw
    });

    clockInfoMenu2 = clockInfo.addInteractive(clockInfoItems, {
      app: "meander",
      x: midX + 2,
      y: R.y,
      w: midX - 3,
      h: barY - R.y,
      draw: clockInfoDraw
    });

    clockInfoMenu3 = clockInfo.addInteractive(clockInfoItems, {
      app: "meander",
      x: R.x,
      y: barY + 1,
      w: R.w,
      h: R.y2 - barY - 1,
      draw: clockInfoDraw
    });

    initialized = true;
    draw();
  };

  Bangle.setUI({
    mode: "clock",
    remove: function() {
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = undefined;
      delete Graphics.prototype.setFont7Seg;

      if (clockInfoMenu && clockInfoMenu.remove) clockInfoMenu.remove();
      if (clockInfoMenu2 && clockInfoMenu2.remove) clockInfoMenu2.remove();
      if (clockInfoMenu3 && clockInfoMenu3.remove) clockInfoMenu3.remove();

      clockInfoMenu = clockInfoMenu2 = clockInfoMenu3 = clockInfoItems = undefined;
      initialized = false;

      if (oldTheme) g.setTheme(oldTheme);
    }
  });

  initLayout();
  // Remove the setTimeout wrapper around initClockInfo
  initClockInfo();
  Bangle.drawWidgets();
}
