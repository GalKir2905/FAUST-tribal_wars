// ==UserScript==
// @name         FAUST Tribal Wars Assistant
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Advanced assistant for Tribal Wars
// @author       Sophie & G4lKir95
// @match        https://*.die-staemme.de/game.php?*&screen=place*
// @match        https://*.staemme.ch/game.php?*&screen=place*
// @match        https://*.plemiona.pl/game.php?*&screen=place*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      self
// ==/UserScript==

(function() {
    'use strict';

    class FAUST {
        constructor() {
            this.version = '2.0';
            this.config = this.loadConfig();
            this.init();
        }

        loadConfig() {
            const defaultConfig = {
                autoFillMode: 'balanced',
                maxLootPercentage: 80,
                minTroopsToLeave: 10,
                maxTransporters: 100,
                useAdvancedLogic: true,
                safeMode: true,
                preserveNobles: true,
                preserveScouts: true
            };

            const saved = GM_getValue('faust_config');
            return saved ? { ...defaultConfig, ...saved } : defaultConfig;
        }

        saveConfig() {
            GM_setValue('faust_config', this.config);
        }

        init() {
            this.createUI();
            this.bindEvents();
            this.loadVillageData();
        }

        createUI() {
            const existingUI = document.getElementById('faust-ui');
            if (existingUI) existingUI.remove();

            const ui = document.createElement('div');
            ui.id = 'faust-ui';
            ui.innerHTML = `
                <div style="position: fixed; top: 50px; right: 10px; width: 300px; background: #f5f5f5; border: 1px solid #ccc; padding: 10px; z-index: 10000; font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">FAUST Assistant v${this.version}</h3>
                    
                    <div style="margin-bottom: 10px;">
                        <label>Mode:</label>
                        <select id="faust-mode">
                            <option value="balanced">Balanced</option>
                            <option value="aggressive">Aggressive</option>
                            <option value="conservative">Conservative</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <label>Max Loot: </label>
                        <input type="number" id="faust-max-loot" value="${this.config.maxLootPercentage}" min="10" max="100" style="width: 60px;">%
                    </div>

                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="faust-safe-mode" ${this.config.safeMode ? 'checked' : ''}>
                        <label for="faust-safe-mode">Safe Mode</label>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <input type="checkbox" id="faust-preserve-nobles" ${this.config.preserveNobles ? 'checked' : ''}>
                        <label for="faust-preserve-nobles">Preserve Nobles</label>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <button id="faust-calculate">Calculate Attack</button>
                        <button id="faust-auto-fill">Auto Fill</button>
                    </div>

                    <div id="faust-status" style="font-size: 12px; color: #666; margin-top: 5px;"></div>
                </div>
            `;

            document.body.appendChild(ui);
            this.updateUIFromConfig();
        }

        updateUIFromConfig() {
            document.getElementById('faust-mode').value = this.config.autoFillMode;
            document.getElementById('faust-max-loot').value = this.config.maxLootPercentage;
            document.getElementById('faust-safe-mode').checked = this.config.safeMode;
            document.getElementById('faust-preserve-nobles').checked = this.config.preserveNobles;
        }

        bindEvents() {
            document.getElementById('faust-calculate').addEventListener('click', () => this.calculateAttack());
            document.getElementById('faust-auto-fill').addEventListener('click', () => this.autoFill());
            
            // Save config on change
            document.getElementById('faust-mode').addEventListener('change', (e) => {
                this.config.autoFillMode = e.target.value;
                this.saveConfig();
            });
            
            document.getElementById('faust-max-loot').addEventListener('change', (e) => {
                this.config.maxLootPercentage = parseInt(e.target.value);
                this.saveConfig();
            });
            
            document.getElementById('faust-safe-mode').addEventListener('change', (e) => {
                this.config.safeMode = e.target.checked;
                this.saveConfig();
            });
            
            document.getElementById('faust-preserve-nobles').addEventListener('change', (e) => {
                this.config.preserveNobles = e.target.checked;
                this.saveConfig();
            });
        }

        loadVillageData() {
            try {
                const villageData = this.getCurrentVillageData();
                const availableTroops = this.getAvailableTroops();
                
                this.villageData = villageData;
                this.availableTroops = availableTroops;
                
                this.updateStatus('Data loaded successfully');
            } catch (error) {
                this.updateStatus('Error loading village data: ' + error.message, 'error');
            }
        }

        getCurrentVillageData() {
            // Get current village resources and capacity from the game UI
            const woodEl = document.querySelector('#wood');
            const clayEl = document.querySelector('#clay');
            const ironEl = document.querySelector('#iron');
            
            if (!woodEl || !clayEl || !ironEl) {
                throw new Error('Could not find resource elements');
            }

            const resources = {
                wood: parseInt(woodEl.textContent.replace(/\./g, '')) || 0,
                clay: parseInt(clayEl.textContent.replace(/\./g, '')) || 0,
                iron: parseInt(ironEl.textContent.replace(/\./g, '')) || 0
            };

            // Get warehouse capacity
            const storageEl = document.querySelector('#storage');
            let capacity = 1000; // default
            if (storageEl) {
                const storageText = storageEl.textContent;
                const match = storageText.match(/\d+/g);
                if (match && match.length >= 2) {
                    capacity = parseInt(match[1]) || 1000;
                }
            }

            return { resources, capacity };
        }

        getAvailableTroops() {
            const troops = {};
            const troopInputs = document.querySelectorAll('input[name^="unit_input_"]');
            
            troopInputs.forEach(input => {
                const match = input.name.match(/unit_input_(\w+)/);
                if (match) {
                    const troopType = match[1];
                    const max = parseInt(input.getAttribute('data-max')) || 0;
                    troops[troopType] = max;
                }
            });

            return troops;
        }

        calculateAttack() {
            try {
                this.updateStatus('Calculating optimal attack...');
                
                const targetResources = this.estimateTargetResources();
                const requiredTroops = this.calculateRequiredTroops(targetResources);
                
                this.displayCalculationResults(requiredTroops, targetResources);
                this.updateStatus('Calculation complete');
                
            } catch (error) {
                this.updateStatus('Calculation error: ' + error.message, 'error');
            }
        }

        estimateTargetResources() {
            const { resources, capacity } = this.villageData;
            const maxLoot = this.config.maxLootPercentage / 100;
            
            // Advanced resource estimation based on village data and game mechanics
            const estimatedResources = {
                wood: Math.min(resources.wood, capacity * maxLoot),
                clay: Math.min(resources.clay, capacity * maxLoot),
                iron: Math.min(resources.iron, capacity * maxLoot)
            };

            // Apply mode-specific adjustments
            switch (this.config.autoFillMode) {
                case 'aggressive':
                    estimatedResources.wood *= 0.9;
                    estimatedResources.clay *= 0.9;
                    estimatedResources.iron *= 0.9;
                    break;
                case 'conservative':
                    estimatedResources.wood *= 0.6;
                    estimatedResources.clay *= 0.6;
                    estimatedResources.iron *= 0.6;
                    break;
                default: // balanced
                    estimatedResources.wood *= 0.75;
                    estimatedResources.clay *= 0.75;
                    estimatedResources.iron *= 0.75;
            }

            return estimatedResources;
        }

        calculateRequiredTroops(targetResources) {
            const troops = {};
            const totalResources = targetResources.wood + targetResources.clay + targetResources.iron;
            
            if (totalResources === 0) {
                return troops;
            }

            // Calculate required transporters based on resource capacity
            const transporterCapacity = 100; // Each transporter carries 100 resources
            const requiredTransporters = Math.ceil(totalResources / transporterCapacity);
            
            // Apply safety limits
            const availableTransporters = this.availableTroops.spear || 0;
            const actualTransporters = Math.min(
                requiredTransporters,
                availableTransporters,
                this.config.maxTransporters
            );

            if (actualTransporters > 0) {
                troops.spear = actualTransporters;
            }

            // Add support troops based on mode
            if (this.config.useAdvancedLogic) {
                const supportRatio = this.getSupportRatio();
                if (supportRatio > 0) {
                    this.addSupportTroops(troops, actualTransporters, supportRatio);
                }
            }

            return troops;
        }

        getSupportRatio() {
            switch (this.config.autoFillMode) {
                case 'aggressive': return 0.3;
                case 'conservative': return 0.1;
                default: return 0.2; // balanced
            }
        }

        addSupportTroops(troops, transporterCount, ratio) {
            const supportCount = Math.floor(transporterCount * ratio);
            
            if (supportCount > 0) {
                // Prioritize swordsmen over other troops for defense
                const availableSwords = this.availableTroops.sword || 0;
                const availableArchers = this.availableTroops.archer || 0;
                
                if (availableSwords > 0) {
                    troops.sword = Math.min(supportCount, availableSwords);
                } else if (availableArchers > 0) {
                    troops.archer = Math.min(supportCount, availableArchers);
                }
            }
        }

        displayCalculationResults(troops, resources) {
            let resultHTML = `
                <div style="margin-top: 10px; padding: 10px; background: white; border: 1px solid #ddd;">
                    <h4 style="margin: 0 0 5px 0;">Recommended Attack:</h4>
                    <div style="font-size: 12px;">
            `;

            if (Object.keys(troops).length === 0) {
                resultHTML += '<p>No troops recommended (insufficient resources or troops)</p>';
            } else {
                for (const [troopType, count] of Object.entries(troops)) {
                    resultHTML += `<div>${this.formatTroopName(troopType)}: ${count}</div>`;
                }
                
                resultHTML += `
                    <div style="margin-top: 5px; color: #666;">
                        Estimated loot: ${Math.round(resources.wood)} Wood, 
                        ${Math.round(resources.clay)} Clay, 
                        ${Math.round(resources.iron)} Iron
                    </div>
                `;
            }

            resultHTML += '</div></div>';

            const statusEl = document.getElementById('faust-status');
            statusEl.innerHTML = resultHTML;
        }

        formatTroopName(troopType) {
            const names = {
                'spear': 'Spearmen',
                'sword': 'Swordsmen',
                'archer': 'Archers',
                'spy': 'Scouts',
                'light': 'Light Cavalry',
                'heavy': 'Heavy Cavalry',
                'ram': 'Rams',
                'catapult': 'Catapults',
                'knight': 'Knights',
                'snob': 'Nobles'
            };
            
            return names[troopType] || troopType;
        }

        autoFill() {
            try {
                this.updateStatus('Auto-filling troops...');
                
                const targetResources = this.estimateTargetResources();
                const requiredTroops = this.calculateRequiredTroops(targetResources);
                
                this.fillTroopInputs(requiredTroops);
                this.updateStatus('Auto-fill complete');
                
            } catch (error) {
                this.updateStatus('Auto-fill error: ' + error.message, 'error');
            }
        }

        fillTroopInputs(troops) {
            for (const [troopType, count] of Object.entries(troops)) {
                const input = document.querySelector(`input[name="unit_input_${troopType}"]`);
                if (input && count > 0) {
                    input.value = count;
                    
                    // Trigger change event for game UI
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            }
        }

        updateStatus(message, type = 'info') {
            const statusEl = document.getElementById('faust-status');
            const color = type === 'error' ? '#d32f2f' : '#666';
            
            if (statusEl) {
                statusEl.innerHTML = `<span style="color: ${color};">${message}</span>`;
            }
            
            console.log(`FAUST: ${message}`);
        }
    }

    // Initialize FAUST when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FAUST());
    } else {
        new FAUST();
    }
})();t