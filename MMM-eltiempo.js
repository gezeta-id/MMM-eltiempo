Module.register('MMM-eltiempo', {
    defaults: {
        cityId: '28079',
        updateInterval: 30*60*1000, // 30 minutos
        mode: 'full',
        apiURL: 'https://www.el-tiempo.net/api/json/v2/provincias/{{provinciaId}}/municipios/{{municipioId}}'
    },
    getStyles: function() {
        return [ 'MMM-eltiempo.css', 'chart.min.css', 'font-awesome.css' ];
    },
    requiresVersion: '2.1.0',
    getScripts: function() {
        return [ 'chart.min.js' ];
    },

    start: function() {
        Log.log('Starting module: ' + this.name);
        this.scheduleDataFetching();
    },

    scheduleDataFetching: function(delay) {
        setTimeout((function() {
          this.fetchData()
           .then(function(r) { return r.json(); })
           .then(this.processData.bind(this))
           .then(this.scheduleNextFetch.bind(this));
        }).bind(this), delay || 50);
    },

    fetchData: function() {
        let url = this.config.apiURL.replace(/{{municipioId}}/, this.config.cityId).replace(/{{provinciaId}}/, this.config.cityId.substring(0,2));
        return fetch(url, { method: 'GET' });
    },
    processData: function(data) {
        this.wdata = {
          nombre: data.municipio.NOMBRE,
          humedad: data.humedad,
          temperaturas: {
           actual: data.temperatura_actual,
           max: data.temperaturas.max,
           min: data.temperaturas.min
          },
          viento: data.viento,
          lluvia: data.lluvia,
          imagen: this.getImageName(data.stateSky),
          series: {
           temperatura: data.pronostico.hoy.temperatura.concat(data.pronostico.manana.temperatura).map(Number),
           lluvia: data.pronostico.hoy.precipitacion.concat(data.pronostico.manana.precipitacion).map(Number)
          }
        };
        if (data.pronostico.hoy.prob_tormenta.some(x=>x!=='0')) { this.data.tormentas = true; }
        if (data.pronostico.hoy.viento.some(x=>parseInt(x.velocidad) > 50)) { this.data.vientosFuertes = true; }
        this.updateDom(200);
    },
    getImageName: function(stateSky) {
        Log.log(stateSky);
        let img = 'noinfo';
        switch (stateSky.id) {
            case '11':
                img = 'soleado';
                break;
            case '12':
                img = 'despejado';
                break;
            case '13':
            case '14':
            case '15': // Muy nuboso
            case '17':
                img = 'nubesclaros';
                break;
            case '46':
                img= 'lluvia';
                break;
            case '51':
                img = 'tormenta';
                break;
            default:
                img = 'noinfo';
        }
        return img;
    },
    scheduleNextFetch: function() {
        this.scheduleDataFetching(this.config.updateInterval);
    },

    getDom: function() {
        const contenedor = document.createElement('div');

        let d = this.wdata;
        if (!d) {
            d = { imagen: 'noinfo', nombre: '', viento: '', lluvia: '', temperaturas: {actual: '', max: '', min: ''} };
            d.series = { temperatura: [], lluvia: [] };
        }

        let colorT = 'etn-normal';
        if (d.temperaturas.actual<0) colorT = 'etn-cold';
        else if (d.temperaturas.actual < 10) colorT = 'etn-cool';
        else if (d.temperaturas.actual > 35) colorT = 'etn-inferno';
        else if (d.temperaturas.actual > 28) colorT = 'etn-hot';

        contenedor.innerHTML = `<div class="etn-card">
          <img src="modules/MMM-eltiempo/img/${d.imagen}.png" />
          <div class="etn-content">
            <span class="etn-city">${d.nombre}</span>
            <span class="etn-current ${colorT}">${d.temperaturas.actual}&deg;C</span>
            <span class="etn-maxmin"> (${d.temperaturas.max}&deg;C / ${d.temperaturas.min}&deg;C) </span>
            <span class="etn-viento">${d.viento} km/h</span>
            <span class="etn-lluvia">${d.lluvia} l</span>
          </div>
        </div>`;
        if (this.config.mode === 'full') {
            const down = document.createElement('div')
            down.setAttribute('class', 'etn-graph');
            const canvas = document.createElement('canvas');
            canvas.setAttribute('height', '100px');
            down.appendChild(canvas);

            let hora = (new Date).getHours();
            let tempMax = Math.max.apply(Math,d.series.temperatura)+5;
            let franja = Array.from(d.series.lluvia, function(v,i) { return (i===hora)?tempMax:0; });

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: d.series.lluvia.map((v,i)=>i.toString()),
                    datasets: [
                        { label: 'Lluvia', data: d.series.lluvia, backgroundColor:'cyan', borderColor:'cyan' },
                        { label: 'Temp', data: d.series.temperatura, borderColor: 'orange' },
                        { label: '', type: 'bar', data: franja, borderColor: '#336633', backgroundColor: '#336633' }
                    ]
                },
                options: { legend: { display: false }, title: {display:false}, scales: {xAxes:[{display: false}]}, color: ['cyan', 'lime'], elements: { point: { radius: 1 } } }
            });

            contenedor.appendChild(down);
        }

        return contenedor;
    },

    notificationReceived: function(type, payload, sender) {
        if (type === 'MODULE_DOM_CREATED') {
        }
    }
});
