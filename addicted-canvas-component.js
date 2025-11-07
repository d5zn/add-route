// SznCanvasComponent - Exact copy of nextPoly canvas logic
// Точная копия компонента canvas из nextPoly
// Version: 2.0 - Updated branding to addicted

console.log('🎨 Loading SznCanvasComponent v2.0 - Updated branding to addicted');

class SznCanvasComponent {
    constructor(canvasElement, store) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.store = store;
        
        // Состояние как в nextPoly
        this.fontsLoaded = false;
        this.imageLoading = true;
        this.backgroundImage = new Image();
        this.logoImage = new Image();
        this.dpr = 1; // Инициализируем DPR по умолчанию
        this.polylineData = null; // Данные маршрута
        this.decodedRoute = null; // Декодированный маршрут
        
        // Конфигурация - динамический размер canvas в зависимости от соотношения
        this.config = {
            canvasWidth: 1080,  // Внутренний размер canvas для рендеринга
            canvasHeight: 1920, // Внутренний размер canvas для рендеринга (9:16)
            aspectRatio: '9/16',
            maxDPR: 1, // Используем фиксированный размер, не нужно DPR scaling
            // Безопасные зоны для контента
            safeArea: {
                top: 250,
                bottom: 100,
                left: 80,
                right: 80
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎯 Initializing SznCanvasComponent...');
        this.setupCanvas();
        this.loadFonts();
        this.loadImages();
        this.subscribeToStore();
        console.log('✅ SznCanvasComponent initialized');
    }
    
    updateCanvasSize() {
        // Размеры канваса теперь управляются через updateCanvasConfig()
        // Эта функция оставлена для совместимости
        console.log(`📐 Canvas size: ${this.config.canvasWidth}x${this.config.canvasHeight}`);
    }
    
    setupCanvas() {
        // Обновляем размеры в зависимости от postStyle
        this.updateCanvasSize();
        
        // Получаем реальные размеры видимой области (navbar + preview padding + editing panel)
        const navbar = document.querySelector('.navbar');
        const editingPanel = document.querySelector('.editing-panel');
        const previewArea = document.querySelector('.preview-area');

        const navbarHeight = navbar ? Math.round(navbar.getBoundingClientRect().height) : 64;
        const panelHeight = editingPanel ? Math.round(editingPanel.getBoundingClientRect().height) : 180;

        let previewPaddingV = 0;
        if (previewArea) {
            const cs = window.getComputedStyle(previewArea);
            previewPaddingV = (parseFloat(cs.paddingTop || '0') || 0) + (parseFloat(cs.paddingBottom || '0') || 0);
        }

        const viewportHeight = window.innerHeight - navbarHeight - panelHeight - previewPaddingV;
        const viewportWidth = previewArea?.clientWidth || window.innerWidth;
        
        // Используем viewport размеры если контейнер пустой
        let containerWidth = viewportWidth;
        let containerHeight = viewportHeight;
        
        // Пытаемся получить реальные размеры контейнера
        try {
            const container = this.canvas.parentElement;
            if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                containerWidth = container.clientWidth;
                containerHeight = container.clientHeight;
            }
        } catch (e) {
            console.warn('⚠️ Could not get container size, using viewport:', e);
        }
        
        // Рассчитываем CSS размеры для отображения (масштабируем под контейнер)
        // Стратегия: стараться занять всю ширину, сохраняя аспект; если высота переполнится — ограничить по высоте
        let displayWidth, displayHeight;
        const canvasAspect = this.config.canvasWidth / this.config.canvasHeight;
        
        // Подгоняем с сохранением пропорций так, чтобы поместиться и по ширине, и по высоте (contain)
        displayWidth = containerWidth;
        displayHeight = displayWidth / canvasAspect;
        if (displayHeight > containerHeight) {
            displayHeight = containerHeight;
            displayWidth = displayHeight * canvasAspect;
        }
        
        // Минимальные размеры для видимости
        if (displayWidth < 100) displayWidth = containerWidth * 0.9;
        if (displayHeight < 100) displayHeight = containerHeight * 0.9;
        
        // Устанавливаем CSS размеры для отображения
        this.canvas.style.width = Math.round(displayWidth) + 'px';
        this.canvas.style.height = Math.round(displayHeight) + 'px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        
        // Устанавливаем фиксированные размеры canvas для рендеринга (1080x1920)
        // Применяем размеры только если они изменились
        if (this.canvas.width !== this.config.canvasWidth || this.canvas.height !== this.config.canvasHeight) {
            this.canvas.width = this.config.canvasWidth;
            this.canvas.height = this.config.canvasHeight;
        }
        
        // DPR = 1 так как используем фиксированный размер
        this.dpr = 1;
        
        console.log(`🎯 Canvas setup: ${this.config.canvasWidth}x${this.config.canvasHeight} (Display: ${Math.floor(displayWidth)}x${Math.floor(displayHeight)}, Container: ${containerWidth}x${containerHeight})`);
        
        // Обработчик resize (добавляем только один раз)
        if (!this._resizeHandlerAdded) {
            this._resizeHandlerAdded = true;
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    this.setupCanvas();
                    this.render();
                }, 100);
            });
        }
    }
    
    loadFonts() {
        // Загружаем шрифты как в nextPoly
        if (typeof window.WebFont !== 'undefined') {
            window.WebFont.load({
                custom: {
                    families: ["Milligram-Regular", "Milligram-Bold"],
                    urls: ["/fonts/Milligram.woff2"]
                },
                active: () => {
                    this.fontsLoaded = true;
                    // Добавляем небольшую задержку для инициализации canvas
                    setTimeout(() => this.render(), 100);
                },
                inactive: () => {
                    console.error("Font loading failed!");
                    this.fontsLoaded = true; // Fallback
                    // Добавляем небольшую задержку для инициализации canvas
                    setTimeout(() => this.render(), 100);
                }
            });
        } else {
            // Fallback если WebFont не загружен
            this.fontsLoaded = true;
            // Добавляем небольшую задержку для инициализации canvas
            setTimeout(() => this.render(), 100);
        }
    }
    
    loadImages() {
        const state = this.store.getState();
        
        // Загружаем фоновое изображение (пользовательское или дефолтное)
        this.imageLoading = true;
        const imageSrc = state.image || '/bg.jpeg'; // Используем bg.jpeg как дефолт
        this.backgroundImage.crossOrigin = "anonymous";
        this.backgroundImage.src = imageSrc;
        this.backgroundImage.onload = () => {
            this.imageLoading = false;
            this.render();
        };
        this.backgroundImage.onerror = () => {
            console.warn('⚠️ Background image failed to load:', imageSrc);
            this.imageLoading = false;
            this.render();
        };
        
        // Загружаем логотип в зависимости от клуба
        this.updateLogo();
    }
    
    updateLogo() {
        const state = this.store.getState();
        const club = state.club || 'not-in-paris';
        
        // Определяем путь к логотипу в зависимости от клуба
        const logoPath = club === 'hedonism' ? '/logo_HEDONISM.svg' : '/logo_NIP.svg';
        
        // Получаем текущий путь из src (убираем origin для сравнения)
        let currentPath = '';
        if (this.logoImage.src) {
            try {
                const url = new URL(this.logoImage.src);
                currentPath = url.pathname;
            } catch (e) {
                currentPath = this.logoImage.src.replace(window.location.origin, '');
            }
        }
        
        // Проверяем, нужно ли загружать новый логотип
        // Если логотип еще не загружен, или путь изменился, или это первая загрузка
        const isInitialLoad = !this.logoImage.src || this.logoImage.src === '' || this.logoImage.src === window.location.href;
        const pathChanged = currentPath !== logoPath && !currentPath.includes('data:image');
        const needsUpdate = isInitialLoad || (!this.logoImage.complete && !currentPath.includes('data:image')) || pathChanged;
        
        if (needsUpdate) {
            // Создаем новый объект Image для загрузки
            const newLogoImage = new Image();
            newLogoImage.crossOrigin = "anonymous";
            newLogoImage.src = logoPath;
            
            newLogoImage.onload = () => {
                // Заменяем старый логотип на новый
                this.logoImage = newLogoImage;
                this.render();
                console.log(`✅ Logo loaded: ${logoPath} for club: ${club}`);
            };
            
            newLogoImage.onerror = () => {
                console.warn(`⚠️ Logo image failed to load: ${logoPath}`);
                // Используем fallback логотип только если это не fallback уже
                if (!this.logoImage.src || !this.logoImage.src.includes('data:image')) {
                    this.logoImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHJ4PSI4IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHRleHQgeD0iMzYiIHk9IjQ1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDAwMDAwIj41Wk48L3RleHQ+Cjwvc3ZnPg==";
                    this.render();
                }
            };
        }
    }
    
    subscribeToStore() {
        let previousImage = this.store.getState().image;
        let previousClub = this.store.getState().club;
        
        this.store.subscribe((state) => {
            let shouldRender = false;
            
            // Проверяем, изменилось ли фоновое изображение
            if (state.image !== previousImage) {
                console.log('🖼️ Background image changed, reloading...');
                previousImage = state.image;
                this.loadBackgroundImage(state.image);
                shouldRender = true;
            }
            
            // Проверяем, изменился ли клуб (для смены логотипа)
            if (state.club !== previousClub) {
                console.log('🏢 Club changed, updating logo...');
                previousClub = state.club;
                this.updateLogo();
                shouldRender = true;
            }
            
            // Рендерим только если что-то изменилось
            if (shouldRender) {
                // Рендер произойдет после загрузки изображения/логотипа
            } else {
                this.render();
            }
        });
    }
    
    // Метод для обновления конфигурации канваса
    updateCanvasConfig(ratio) {
        if (ratio === '4:5') {
            this.config.canvasWidth = 1080;
            this.config.canvasHeight = 1350;
            this.config.aspectRatio = '4/5';
        } else if (ratio === '9:16') {
            this.config.canvasWidth = 1080;
            this.config.canvasHeight = 1920;
            this.config.aspectRatio = '9/16';
        }
        
        // Обновляем размеры канваса
        this.canvas.width = this.config.canvasWidth;
        this.canvas.height = this.config.canvasHeight;
        
        // Пересчитываем размеры отображения
        this.setupCanvas();
        
        console.log(`🔄 Canvas config updated: ${this.config.canvasWidth}x${this.config.canvasHeight} (${ratio})`);
    }
    
    render() {
        if (!this.fontsLoaded) return;
        
        const state = this.store.getState();
        
        // Обновляем размеры в зависимости от postStyle
        this.updateCanvasSize();
        
        // Используем фиксированные размеры canvas (1080x1920)
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Проверяем, что canvas имеет валидные размеры
        if (width <= 0 || height <= 0) {
            console.warn('⚠️ Canvas has invalid dimensions, forcing setup:', width, 'x', height);
            this.setupCanvas();
            return;
        }
        
        // Очищаем canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Рендерим
        this.renderBackground(state, width, height);
        this.renderOverlay(state, width, height);
        this.renderContent(state, width, height);
        this.renderLogo(state, width, height);
        
        console.log(`🎨 Canvas rendered at ${width}x${height}`);
    }
    
    renderBackground(state, width, height) {
        // Проверяем режим фона
        if (state.backgroundMode === 'french') {
            this.drawFrenchFlag(width, height);
            return;
        }
        
        if (state.backgroundMode === 'gradient') {
            this.drawGradient(width, height);
            return;
        }
        
        if (state.backgroundMode === 'solid') {
            this.drawSolidColor(width, height, state.fontColor === 'white' ? '#000000' : '#ffffff');
            return;
        }
        
        // По умолчанию рисуем изображение
        if (this.imageLoading || !this.backgroundImage.complete || this.backgroundImage.naturalWidth === 0) return;
        
        // Адаптивное масштабирование как в nextPoly
        this.drawBackgroundImage(this.backgroundImage, state, width, height);
    }
    
    drawBackgroundImage(img, state, width, height) {
        
        // Точная логика масштабирования как в nextPoly
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
            // Изображение шире - масштабируем по высоте
            drawHeight = height;
            drawWidth = drawHeight * imgAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
        } else {
            // Изображение уже - масштабируем по ширине
            drawWidth = width;
            drawHeight = drawWidth / imgAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
        }
        
        this.ctx.save();
        
        // Применяем монохромный фильтр если включен
        if (state.isMono) {
            console.log('🎨 Applying mono filter...');
            
            // Метод 1: Попробуем CSS фильтр
            this.ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
            this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // Метод 2: Если CSS фильтр не сработал, применяем альтернативный метод
            // Создаем временный канвас для обработки изображения
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            
            // Рисуем изображение на временный канвас
            tempCtx.drawImage(img, 0, 0, drawWidth, drawHeight);
            
            // Получаем данные пикселей
            const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
            const data = imageData.data;
            
            // Применяем монохромный эффект к каждому пикселю
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Конвертируем в оттенки серого
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                
                // Применяем контраст и яркость
                const contrast = 1.5;
                const brightness = 1.1;
                const adjustedGray = Math.min(255, Math.max(0, (gray - 128) * contrast + 128 * brightness));
                
                data[i] = adjustedGray;     // Red
                data[i + 1] = adjustedGray; // Green
                data[i + 2] = adjustedGray; // Blue
                // data[i + 3] остается без изменений (alpha)
            }
            
            // Возвращаем обработанные данные
            tempCtx.putImageData(imageData, 0, 0);
            
            // Очищаем основной канвас и рисуем обработанное изображение
            this.ctx.clearRect(drawX, drawY, drawWidth, drawHeight);
            this.ctx.filter = 'none';
            this.ctx.drawImage(tempCanvas, drawX, drawY);
            
            console.log('🎨 Applied pixel-based mono filter');
        } else {
            this.ctx.filter = 'none';
            this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        }
        
        this.ctx.restore();
    }
    
    drawFrenchFlag(width, height) {
        // Французский флаг: синий, белый, красный (вертикальные полосы)
        const stripeWidth = width / 3;
        
        this.ctx.save();
        
        // Синий (Bleu)
        this.ctx.fillStyle = '#0055A4';
        this.ctx.fillRect(0, 0, stripeWidth, height);
        
        // Белый (Blanc)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(stripeWidth, 0, stripeWidth, height);
        
        // Красный (Rouge)
        this.ctx.fillStyle = '#EF4135';
        this.ctx.fillRect(stripeWidth * 2, 0, stripeWidth, height);
        
        this.ctx.restore();
    }
    
    drawGradient(width, height) {
        // Красивый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
    }
    
    drawSolidColor(width, height, color) {
        // Однотонный фон
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
    }
    
    renderOverlay(state, width, height) {
        // Проверяем, что canvas имеет валидные размеры
        if (width <= 0 || height <= 0) {
            console.warn('⚠️ Canvas has invalid dimensions:', width, 'x', height);
            return;
        }
        
        // Создаем полупрозрачный overlay как в nextPoly
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        const overlayCtx = overlayCanvas.getContext('2d');
        
        // Цвет overlay зависит от основного цвета
        const overlayColor = state.fontColor === 'white' 
            ? 'rgba(0, 0, 0, 0.4)' 
            : 'rgba(255, 255, 255, 0.4)';
        
        overlayCtx.fillStyle = overlayColor;
        overlayCtx.fillRect(0, 0, width, height);
        
        this.ctx.drawImage(overlayCanvas, 0, 0, width, height);
    }
    
    renderContent(state, width, height) {
        
        // Рендерим заголовок
        if (state.titleVisible.visible) {
            this.renderTitle(state, width, height);
        }
        
        // Рендерим метрики
        this.renderMetrics(state, width, height);
        
        // Рендерим маршрут
        this.renderRoute(state, width, height);
    }
    
    renderTitle(state, width, height) {
        // Масштабируем размеры для 1080x1920
        const scale = width / 1080;
        const safeArea = this.config.safeArea;
        
        // Позиция заголовка с учетом безопасной зоны сверху
        const titleTop = safeArea.top * scale;
        
        // Вычисляем позицию логотипа (как в renderLogo)
        const logoSize = 180 * scale;
        const logoX = width - logoSize - (safeArea.right * scale);
        
        // Заголовок - 52px
        const titleFontSize = Math.floor(52 * scale);
        this.ctx.save();
        this.ctx.fillStyle = state.fontColor;
        this.ctx.font = `bold ${titleFontSize}px Inter, sans-serif`;
        this.ctx.textAlign = 'left';
        
        // Используем безопасные зоны слева
        const leftMargin = safeArea.left * scale;
        // Ограничиваем ширину до логотипа минус 20px
        const spacingFromLogo = 20 * scale;
        const maxWidth = logoX - leftMargin - spacingFromLogo;
        
        // Рисуем название и получаем конечную позицию Y
        const titleLineHeight = titleFontSize * 1.2; // Межстрочный интервал для названия
        const titleEndY = this.wrapText(state.title, leftMargin, titleTop, maxWidth, titleFontSize);
        
        // Подзаголовок (дата) - 32px
        const subtitleFontSize = Math.floor(32 * scale);
        this.ctx.font = `${subtitleFontSize}px Inter, sans-serif`;
        
        // Размещаем дату сразу после названия (используем реальную конечную позицию названия)
        // Добавляем небольшой отступ между названием и датой
        const spacingBetweenTitleAndDate = 8 * scale; // Отступ 8px
        const subtitleY = titleEndY + spacingBetweenTitleAndDate; // Дата сдвигается вниз в зависимости от количества строк названия
        this.wrapText(state.date.toUpperCase(), leftMargin, subtitleY, maxWidth, subtitleFontSize);
        
        this.ctx.restore();
    }
    
    renderMetrics(state, width, height) {
        const { RideData, speedData } = state;
        
        // Фильтруем только видимые метрики
        const visibleRideData = RideData.filter(item => item.visible);
        const visibleSpeedData = speedData.filter(item => item.visible);
        
        // Создаем массив метрик в точном порядке кнопок:
        // Distance, Elevation, Time, Speed
        const orderedMetrics = [];
        
        // Находим метрики по названиям
        const distanceMetric = visibleRideData.find(item => item.dataName.toLowerCase().includes('distance'));
        const elevationMetric = visibleRideData.find(item => item.dataName.toLowerCase().includes('elevation'));
        const timeMetric = visibleRideData.find(item => item.dataName.toLowerCase().includes('time'));
        const speedMetric = visibleSpeedData.find(item => item.dataName.toLowerCase().includes('speed'));
        
        // Добавляем в порядке кнопок
        if (distanceMetric) orderedMetrics.push(distanceMetric);
        if (elevationMetric) orderedMetrics.push(elevationMetric);
        if (timeMetric) orderedMetrics.push(timeMetric);
        if (speedMetric) orderedMetrics.push(speedMetric);
        
        if (orderedMetrics.length === 0) return;
        
        // Масштабируем размеры для 1080x1920
        const scale = width / 1080;
        const safeArea = this.config.safeArea;
        
        // Параметры grid
        const columns = 3;
        const labelFontSize = Math.floor(32 * scale);
        const valueFontSize = Math.floor(52 * scale);
        const cellHeight = valueFontSize + labelFontSize + 20 * scale;
        const leftMargin = safeArea.left * scale;
        const availableWidth = width - (safeArea.left + safeArea.right) * scale;
        const cellWidth = availableWidth / columns;
        
        // Начальная позиция снизу с учетом безопасной зоны
        const startY = height - (safeArea.bottom * scale);
        
        this.ctx.save();
        this.ctx.fillStyle = state.fontColor;
        this.ctx.textAlign = 'left';
        
        // Рендерим метрики в обратном порядке: Speed в первом ряду, остальные во втором
        // Первый ряд: Speed (по центру)
        // Второй ряд: Distance (col=0), Elevation (col=1), Time (col=2)
        
        // Первый ряд
        const firstRowY = startY;
        const secondRowY = startY - cellHeight - 44 * scale;
        
        // Speed (первый ряд, по центру)
        if (orderedMetrics[3]) {
            const x = leftMargin + cellWidth + (cellWidth / 2);
            this.ctx.textAlign = 'center';
            this.ctx.font = `${labelFontSize}px Inter, sans-serif`;
            this.ctx.fillText(orderedMetrics[3].dataName.toUpperCase(), x, firstRowY - valueFontSize - 10 * scale);
            this.ctx.font = `bold ${valueFontSize}px Inter, sans-serif`;
            const displayValue = orderedMetrics[3].data && orderedMetrics[3].data !== '' && orderedMetrics[3].data !== '0' ? orderedMetrics[3].data : '—';
            this.ctx.fillText(displayValue, x, firstRowY);
        }
        
        // Distance (col=0, левое выравнивание)
        if (orderedMetrics[0]) {
            const x = leftMargin;
            this.ctx.textAlign = 'left';
            this.ctx.font = `${labelFontSize}px Inter, sans-serif`;
            this.ctx.fillText(orderedMetrics[0].dataName.toUpperCase(), x, secondRowY - valueFontSize - 10 * scale);
            this.ctx.font = `bold ${valueFontSize}px Inter, sans-serif`;
            const displayValue = orderedMetrics[0].data && orderedMetrics[0].data !== '' && orderedMetrics[0].data !== '0' ? orderedMetrics[0].data : '—';
            this.ctx.fillText(displayValue, x, secondRowY);
        }
        
        // Elevation (col=1, центральное выравнивание)
        if (orderedMetrics[1]) {
            const x = leftMargin + cellWidth + (cellWidth / 2);
            this.ctx.textAlign = 'center';
            this.ctx.font = `${labelFontSize}px Inter, sans-serif`;
            this.ctx.fillText(orderedMetrics[1].dataName.toUpperCase(), x, secondRowY - valueFontSize - 10 * scale);
            this.ctx.font = `bold ${valueFontSize}px Inter, sans-serif`;
            const displayValue = orderedMetrics[1].data && orderedMetrics[1].data !== '' && orderedMetrics[1].data !== '0' ? orderedMetrics[1].data : '—';
            this.ctx.fillText(displayValue, x, secondRowY);
        }
        
        // Time (col=2, правое выравнивание)
        if (orderedMetrics[2]) {
            const x = leftMargin + (2 * cellWidth) + cellWidth;
            this.ctx.textAlign = 'right';
            this.ctx.font = `${labelFontSize}px Inter, sans-serif`;
            this.ctx.fillText(orderedMetrics[2].dataName.toUpperCase(), x, secondRowY - valueFontSize - 10 * scale);
            this.ctx.font = `bold ${valueFontSize}px Inter, sans-serif`;
            const displayValue = orderedMetrics[2].data && orderedMetrics[2].data !== '' && orderedMetrics[2].data !== '0' ? orderedMetrics[2].data : '—';
            this.ctx.fillText(displayValue, x, secondRowY);
        }
        
        this.ctx.restore();
    }
    
    // Этот метод больше не используется - renderMetrics() теперь рендерит в grid
    renderMetricGroup(metrics, width, height, bottomY, scale) {
        // Deprecated - используется новый grid layout в renderMetrics()
        return bottomY;
    }
    
    renderRoute(state, width, height) {
        if (!this.decodedRoute || this.decodedRoute.length === 0) {
            return;
        }
        
        // Получаем границы маршрута
        const bounds = this.getRouteBounds(this.decodedRoute);
        if (!bounds) return;
        
        // Рассчитываем масштаб и смещение для центрирования
        const scale = width / 1080;
        const safeArea = this.config.safeArea;
        
        // Доступная область для маршрута (между заголовком и метриками)
        const routeTop = (safeArea.top + 150) * scale; // После заголовка
        const routeBottom = height - (safeArea.bottom + 280) * scale; // Над метриками с отступом 350px
        const routeLeft = safeArea.left * scale;
        const routeRight = width - (safeArea.right * scale);
        
        const routeWidth = routeRight - routeLeft;
        const routeHeight = routeBottom - routeTop;
        
        // Масштаб для вписывания маршрута
        const latRange = bounds.maxLat - bounds.minLat;
        const lngRange = bounds.maxLng - bounds.minLng;
        
        const scaleX = routeWidth / lngRange;
        const scaleY = routeHeight / latRange;
        const routeScale = Math.min(scaleX, scaleY) * 0.9; // 90% для отступов
        
        // Центрирование
        const centerLat = (bounds.maxLat + bounds.minLat) / 2;
        const centerLng = (bounds.maxLng + bounds.minLng) / 2;
        
        // Определяем цвет маршрута в зависимости от выбранного клуба
        const club = state.club || 'not-in-paris';
        let strokeStyle;
        
        if (club === 'hedonism') {
            // HEDONISM - сплошной цвет #FF6CC9
            strokeStyle = '#FF6CC9';
        } else {
            // NOT IN PARIS - градиент (текущий)
            const gradientCenterX = routeLeft + routeWidth / 2;
            const gradientTop = routeTop;
            const gradientBottom = routeBottom;
            
            const gradient = this.ctx.createLinearGradient(
                gradientCenterX, gradientTop, 
                gradientCenterX, gradientBottom
            );
            gradient.addColorStop(0, '#2A3587');
            gradient.addColorStop(0.495192, 'white');
            gradient.addColorStop(1, '#CF2228');
            strokeStyle = gradient;
        }
        
        // Рисуем маршрут
        this.ctx.save();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = 8 * scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        for (let i = 0; i < this.decodedRoute.length; i++) {
            const point = this.decodedRoute[i];
            const x = routeLeft + routeWidth / 2 + (point[1] - centerLng) * routeScale;
            const y = routeTop + routeHeight / 2 - (point[0] - centerLat) * routeScale;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        this.ctx.restore();
        
        console.log(`🗺️ Route rendered: ${this.decodedRoute.length} points`);
    }
    
    interpolateColor(color1, color2, factor) {
        // Применяем easing функцию для более плавного перехода
        const easedFactor = this.easeInOutCubic(factor);
        
        // Конвертируем hex цвета в RGB
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // Интерполируем каждый канал с плавным переходом
        const r = Math.round(r1 + (r2 - r1) * easedFactor);
        const g = Math.round(g1 + (g2 - g1) * easedFactor);
        const b = Math.round(b1 + (b2 - b1) * easedFactor);
        
        // Конвертируем обратно в hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    easeInOutCubic(t) {
        // Кубическая функция easing для более плавных переходов
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    getRouteBounds(route) {
        if (!route || route.length === 0) return null;
        
        let minLat = route[0][0];
        let maxLat = route[0][0];
        let minLng = route[0][1];
        let maxLng = route[0][1];
        
        route.forEach(point => {
            minLat = Math.min(minLat, point[0]);
            maxLat = Math.max(maxLat, point[0]);
            minLng = Math.min(minLng, point[1]);
            maxLng = Math.max(maxLng, point[1]);
        });
        
        return { minLat, maxLat, minLng, maxLng };
    }
    
    renderLogo(state, width, height) {
        if (!this.logoImage.complete || this.logoImage.naturalWidth === 0) return;
        
        // Масштабируем размеры для 1080x1920
        const scale = width / 1080;
        const safeArea = this.config.safeArea;
        
        // Позиционируем логотип в правом верхнем углу с учетом безопасной зоны
        const logoSize = 180 * scale;
        const logoX = width - logoSize - (safeArea.right * scale);
        const logoY = (safeArea.top * scale) - 84 * scale; // Подняли еще на 20px (64 + 20 = 84)
        
        this.ctx.save();
        this.ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
        this.ctx.restore();
    }
    
    // Утилита для переноса текста как в nextPoly
    wrapText(text, x, y, maxWidth, fontSize) {
        if (!text) return y;
        
        const words = text.split(' ');
        let line = '';
        let lineY = y;
        const lineHeight = fontSize * 1.2; // Межстрочный интервал
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + (i < words.length - 1 ? ' ' : '');
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                // Текущая строка не помещается, отрисовываем предыдущую
                this.ctx.fillText(line.trim(), x, lineY);
                line = '';
                lineY += lineHeight;
                
                // Проверяем, помещается ли само слово на новой строке
                const wordMetrics = this.ctx.measureText(words[i]);
                if (wordMetrics.width > maxWidth) {
                    // Слово слишком длинное, разбиваем по символам
                    let charLine = '';
                    for (let char of words[i]) {
                        const charTestLine = charLine + char;
                        const charMetrics = this.ctx.measureText(charTestLine);
                        if (charMetrics.width > maxWidth && charLine.length > 0) {
                            this.ctx.fillText(charLine, x, lineY);
                            charLine = char;
                            lineY += lineHeight;
                        } else {
                            charLine = charTestLine;
                        }
                    }
                    line = charLine + (i < words.length - 1 ? ' ' : '');
                } else {
                    line = words[i] + (i < words.length - 1 ? ' ' : '');
                }
            } else {
                line = testLine;
            }
        }
        
        // Отрисовываем оставшуюся строку
        if (line.trim()) {
            this.ctx.fillText(line.trim(), x, lineY);
        }
        
        return lineY;
    }
    
    // Методы для обновления состояния
    setPolylineData(polyline) {
        if (!polyline) {
            console.warn('⚠️ No polyline data provided');
            return;
        }
        
        this.polylineData = polyline;
        
        // Декодируем polyline используя window.polyline
        if (typeof window.polyline !== 'undefined') {
            try {
                this.decodedRoute = window.polyline.decode(polyline);
                console.log(`✅ Polyline decoded: ${this.decodedRoute.length} points`);
                this.render();
            } catch (error) {
                console.error('❌ Error decoding polyline:', error);
                this.decodedRoute = null;
            }
        } else {
            console.error('❌ Polyline library not loaded');
        }
    }
    
    // Экспорт
    exportAsImage(format = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(format, quality);
    }
    
    exportAsBlob(format = 'image/png', quality = 1.0) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, format, quality);
        });
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SznCanvasComponent;
} else {
    window.SznCanvasComponent = SznCanvasComponent;
}
