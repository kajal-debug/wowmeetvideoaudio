class StatsManager {
    constructor(){
        this.statsDiv = document.getElementById('stats');
        
        this.stats = [];
        
        // 0: FPS, 1: MS, 2: MB
        for (let i = 0; i <= 2; i++) {
            const stat = new Stats();
            stat.showPanel(i);
            stat.dom.style.position = 'relative';
            stat.dom.style.float = 'left';
            this.statsDiv.appendChild(stat.dom);
            this.stats.push(stat);
        }

        this.active = true;
    }

    update() {
        for (const stat of this.stats)
          stat.update();
      }
}