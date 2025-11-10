/**
 * Scratch 3.0 Extension for Reachy Mini Robot (Enhanced Version)
 * This extension allows controlling Reachy Mini from Scratch with full API support
 */

(function(Scratch) {
    'use strict';

    // APIのベースURL（Reachy Mini daemon）
    const API_BASE = 'http://localhost:8000/api';

    // Reachy Miniアイコン（Base64エンコードされたSVG）
    // 実際のReachy Miniに忠実なデザイン: 横長の長方形の顔、2本のアンテナ（先端の球体なし）、大きな目を横ラインでつなぐ、口なし
    const iconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIOiDjOaZr+WGhiAtLT4KICA8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyOCIgZmlsbD0iIzRDOTdGRiIvPgoKICA8IS0tIOODreODnOODg+ODiOOBrumgremDqO+8iOaoqumVt+OBrumVt+aWueW9ou+8iSAtLT4KICA8cmVjdCB4PSIxNiIgeT0iMjYiIHdpZHRoPSIyOCIgaGVpZ2h0PSIxOCIgcng9IjQiIGZpbGw9IndoaXRlIi8+CgogIDwhLS0g5bem55uuIC0tPgogIDxlbGxpcHNlIGN4PSIyNCIgY3k9IjM1IiByeD0iMy41IiByeT0iNC41IiBmaWxsPSIjNEM5N0ZGIi8+CiAgPGVsbGlwc2UgY3g9IjI0IiBjeT0iMzQiIHJ4PSIxLjgiIHJ5PSIyLjIiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjYiLz4KCiAgPCEtLSDlj7Pnm64gLS0+CiAgPGVsbGlwc2UgY3g9IjM2IiBjeT0iMzUiIHJ4PSIzLjUiIHJ5PSI0LjUiIGZpbGw9IiM0Qzk3RkYiLz4KICA8ZWxsaXBzZSBjeD0iMzYiIGN5PSIzNCIgcng9IjEuOCIgcnk9IjIuMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNiIvPgoKICA8IS0tIOebruOCkuOBpOOBquOBkOaoquOBruODqeOCpOODsyAtLT4KICA8bGluZSB4MT0iMjcuNSIgeTE9IjM1IiB4Mj0iMzIuNSIgeTI9IjM1IiBzdHJva2U9IiM0Qzk3RkYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KCiAgPCEtLSDlt6bjgqLjg7Pjg4bjg4rvvIjjg6njgqTjg7Pjga7jgb/jgIHnkIPkvZPjgarjgZfvvIkgLS0+CiAgPGxpbmUgeDE9IjIyIiB5MT0iMjYiIHgyPSIxNiIgeTI9IjEyIgogICAgICAgIHN0cm9rZT0id2hpdGUiCiAgICAgICAgc3Ryb2tlLXdpZHRoPSIzIgogICAgICAgIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgoKICA8IS0tIOWPs+OCouODs+ODhuODiu+8iOODqeOCpOODs+OBruOBv+OAgeeQg+S9k+OBquOBl++8iSAtLT4KICA8bGluZSB4MT0iMzgiIHkxPSIyNiIgeDI9IjQ0IiB5Mj0iMTIiCiAgICAgICAgc3Ryb2tlPSJ3aGl0ZSIKICAgICAgICBzdHJva2Utd2lkdGg9IjMiCiAgICAgICAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CgogIDwhLS0g44Oc44OH44Kj44Gu56S65ZSG77yI5LiL6YOo77yJIC0tPgogIDxyZWN0IHg9IjIwIiB5PSI0NCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC43Ii8+Cjwvc3ZnPgo=';

    class ReachyMiniExtension {
        constructor() {
            this.lastMoveUUID = null;
            this.recordedMovesCache = {};
        }

        getInfo() {
            return {
                id: 'reachymini',
                name: 'Reachy Mini',
                blockIconURI: iconURI,
                menuIconURI: iconURI,
                color1: '#4C97FF',
                color2: '#3373CC',
                color3: '#2E5BA6',
                blocks: [
                    // === 基本動作 ===
                    {
                        opcode: 'wakeUp',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ロボットを起こす'
                    },
                    {
                        opcode: 'gotoSleep',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ロボットを寝かせる'
                    },
                    '---',
                    // === 頭の制御 ===
                    {
                        opcode: 'moveHeadSimple',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '頭を [DIRECTION] に動かす',
                        arguments: {
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directions',
                                defaultValue: 'up'
                            }
                        }
                    },
                    {
                        opcode: 'moveHeadCustom',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '頭を動かす pitch:[PITCH] yaw:[YAW] roll:[ROLL] 時間:[DURATION]秒',
                        arguments: {
                            PITCH: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            YAW: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            ROLL: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            DURATION: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 2.0
                            }
                        }
                    },
                    {
                        opcode: 'resetHead',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '頭を正面に戻す'
                    },
                    '---',
                    // === アンテナ制御 ===
                    {
                        opcode: 'moveAntennas',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'アンテナを動かす 左:[LEFT]° 右:[RIGHT]°',
                        arguments: {
                            LEFT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            RIGHT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },
                    {
                        opcode: 'moveAntennasSymmetric',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'アンテナを [ANGLE]° にする',
                        arguments: {
                            ANGLE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },
                    '---',
                    // === モーター制御 ===
                    {
                        opcode: 'setMotorMode',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーターを [MODE] にする',
                        arguments: {
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorModes',
                                defaultValue: 'enabled'
                            }
                        }
                    },
                    {
                        opcode: 'getMotorStatus',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'モーターの状態'
                    },
                    '---',
                    // === Recorded Moves（事前録画された動作） ===
                    {
                        opcode: 'playRecordedMove',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '動作を再生 [DATASET]/[MOVE]',
                        arguments: {
                            DATASET: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'pollen-robotics/reachy_mini_moves'
                            },
                            MOVE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'nod-yes'
                            }
                        }
                    },
                    {
                        opcode: 'listRecordedMoves',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '利用可能な動作リスト [DATASET]',
                        arguments: {
                            DATASET: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'pollen-robotics/reachy_mini_moves'
                            }
                        }
                    },
                    '---',
                    // === 動作制御 ===
                    {
                        opcode: 'stopCurrentMove',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '実行中の動作を停止'
                    },
                    {
                        opcode: 'getRunningMoves',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '実行中の動作数'
                    },
                    '---',
                    // === 状態取得（レポーター） ===
                    {
                        opcode: 'getHeadPitch',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '頭のpitch角度'
                    },
                    {
                        opcode: 'getHeadYaw',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '頭のyaw角度'
                    },
                    {
                        opcode: 'getHeadRoll',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '頭のroll角度'
                    },
                    {
                        opcode: 'getAntennaLeft',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '左アンテナの角度'
                    },
                    {
                        opcode: 'getAntennaRight',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '右アンテナの角度'
                    },
                    {
                        opcode: 'getBodyYaw',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '体のyaw角度'
                    },
                    '---',
                    // === システム情報 ===
                    {
                        opcode: 'getDaemonStatus',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'daemon状態'
                    }
                ],
                menus: {
                    directions: {
                        acceptReporters: true,
                        items: [
                            { text: '上', value: 'up' },
                            { text: '下', value: 'down' },
                            { text: '左', value: 'left' },
                            { text: '右', value: 'right' },
                            { text: '左上', value: 'upleft' },
                            { text: '右上', value: 'upright' }
                        ]
                    },
                    motorModes: {
                        acceptReporters: true,
                        items: [
                            { text: 'ON (有効)', value: 'enabled' },
                            { text: 'OFF (無効)', value: 'disabled' },
                            { text: 'コンプライアント', value: 'gravity_compensation' }
                        ]
                    }
                }
            };
        }

        // ==========================================
        // 基本動作
        // ==========================================

        /**
         * ロボットを起こす
         */
        async wakeUp() {
            try {
                const response = await fetch(`${API_BASE}/move/play/wake_up`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                this.lastMoveUUID = data.uuid;
                return true;
            } catch (error) {
                console.error('Wake up failed:', error);
                return false;
            }
        }

        /**
         * ロボットを寝かせる
         */
        async gotoSleep() {
            try {
                const response = await fetch(`${API_BASE}/move/play/goto_sleep`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                this.lastMoveUUID = data.uuid;
                return true;
            } catch (error) {
                console.error('Goto sleep failed:', error);
                return false;
            }
        }

        // ==========================================
        // 頭の制御
        // ==========================================

        /**
         * 頭を簡単な方向に動かす
         */
        async moveHeadSimple(args) {
            const direction = args.DIRECTION;
            let pitch = 0, yaw = 0, roll = 0;

            // 方向に応じた角度設定（度数法で指定、後でラジアンに変換）
            switch (direction) {
                case 'up':
                    pitch = 15;
                    break;
                case 'down':
                    pitch = -15;
                    break;
                case 'left':
                    yaw = 20;
                    break;
                case 'right':
                    yaw = -20;
                    break;
                case 'upleft':
                    pitch = 15;
                    yaw = 20;
                    break;
                case 'upright':
                    pitch = 15;
                    yaw = -20;
                    break;
            }

            return this.moveHeadCustom({
                PITCH: pitch,
                YAW: yaw,
                ROLL: roll,
                DURATION: 1.5
            });
        }

        /**
         * カスタム角度で頭を動かす
         */
        async moveHeadCustom(args) {
            const pitch = this._degToRad(args.PITCH);
            const yaw = this._degToRad(args.YAW);
            const roll = this._degToRad(args.ROLL);
            const duration = args.DURATION;

            const requestBody = {
                head_pose: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0,
                    roll: roll,
                    pitch: pitch,
                    yaw: yaw
                },
                duration: duration,
                interpolation: 'minjerk'
            };

            try {
                const response = await fetch(`${API_BASE}/move/goto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                const data = await response.json();
                this.lastMoveUUID = data.uuid;
                return true;
            } catch (error) {
                console.error('Move head failed:', error);
                return false;
            }
        }

        /**
         * 頭を正面に戻す
         */
        async resetHead() {
            return this.moveHeadCustom({
                PITCH: 0,
                YAW: 0,
                ROLL: 0,
                DURATION: 2.0
            });
        }

        // ==========================================
        // アンテナ制御
        // ==========================================

        /**
         * アンテナを動かす（個別指定）
         */
        async moveAntennas(args) {
            const leftRad = this._degToRad(args.LEFT);
            const rightRad = this._degToRad(args.RIGHT);

            const requestBody = {
                antennas: [leftRad, rightRad],
                duration: 1.0,
                interpolation: 'minjerk'
            };

            try {
                const response = await fetch(`${API_BASE}/move/goto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
                const data = await response.json();
                this.lastMoveUUID = data.uuid;
                return true;
            } catch (error) {
                console.error('Move antennas failed:', error);
                return false;
            }
        }

        /**
         * アンテナを対称に動かす
         */
        async moveAntennasSymmetric(args) {
            const angle = args.ANGLE;
            return this.moveAntennas({
                LEFT: angle,
                RIGHT: angle
            });
        }

        // ==========================================
        // モーター制御
        // ==========================================

        /**
         * モーターモードを設定
         * @param {Object} args - enabled, disabled, gravity_compensation
         */
        async setMotorMode(args) {
            const mode = args.MODE;

            try {
                const response = await fetch(`${API_BASE}/motors/set_mode/${mode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                console.log('Motor mode changed:', data.status);
                return true;
            } catch (error) {
                console.error('Set motor mode failed:', error);
                return false;
            }
        }

        /**
         * モーターステータスを取得
         */
        async getMotorStatus() {
            try {
                const response = await fetch(`${API_BASE}/motors/status`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                return data.mode || 'unknown';
            } catch (error) {
                console.error('Get motor status failed:', error);
                return 'error';
            }
        }

        // ==========================================
        // Recorded Moves（事前録画された動作）
        // ==========================================

        /**
         * 事前録画された動作を再生
         */
        async playRecordedMove(args) {
            const dataset = args.DATASET;
            const move = args.MOVE;

            try {
                const response = await fetch(
                    `${API_BASE}/move/play/recorded-move-dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(move)}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                const data = await response.json();
                this.lastMoveUUID = data.uuid;
                return true;
            } catch (error) {
                console.error('Play recorded move failed:', error);
                return false;
            }
        }

        /**
         * 利用可能な録画動作のリストを取得
         */
        async listRecordedMoves(args) {
            const dataset = args.DATASET;

            // キャッシュチェック
            if (this.recordedMovesCache[dataset]) {
                return this.recordedMovesCache[dataset].join(', ');
            }

            try {
                const response = await fetch(
                    `${API_BASE}/move/recorded-move-datasets/list/${encodeURIComponent(dataset)}`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                const data = await response.json();

                // キャッシュに保存
                this.recordedMovesCache[dataset] = data;

                return data.join(', ');
            } catch (error) {
                console.error('List recorded moves failed:', error);
                return 'error';
            }
        }

        // ==========================================
        // 動作制御
        // ==========================================

        /**
         * 実行中の動作を停止
         */
        async stopCurrentMove() {
            if (!this.lastMoveUUID) {
                console.warn('No move to stop');
                return false;
            }

            try {
                const response = await fetch(`${API_BASE}/move/stop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uuid: this.lastMoveUUID })
                });
                const data = await response.json();
                console.log('Move stopped:', data.message);
                this.lastMoveUUID = null;
                return true;
            } catch (error) {
                console.error('Stop move failed:', error);
                return false;
            }
        }

        /**
         * 実行中の動作数を取得
         */
        async getRunningMoves() {
            try {
                const response = await fetch(`${API_BASE}/move/running`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                return data.length;
            } catch (error) {
                console.error('Get running moves failed:', error);
                return 0;
            }
        }

        // ==========================================
        // 状態取得
        // ==========================================

        /**
         * ロボットの状態を取得
         */
        async _getState() {
            try {
                const response = await fetch(`${API_BASE}/state/full`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                return await response.json();
            } catch (error) {
                console.error('Get state failed:', error);
                return null;
            }
        }

        /**
         * 頭のpitch角度を取得
         */
        async getHeadPitch() {
            const state = await this._getState();
            if (state && state.head_pose) {
                return this._radToDeg(state.head_pose.pitch);
            }
            return 0;
        }

        /**
         * 頭のyaw角度を取得
         */
        async getHeadYaw() {
            const state = await this._getState();
            if (state && state.head_pose) {
                return this._radToDeg(state.head_pose.yaw);
            }
            return 0;
        }

        /**
         * 頭のroll角度を取得
         */
        async getHeadRoll() {
            const state = await this._getState();
            if (state && state.head_pose) {
                return this._radToDeg(state.head_pose.roll);
            }
            return 0;
        }

        /**
         * 左アンテナの角度を取得
         */
        async getAntennaLeft() {
            const state = await this._getState();
            if (state && state.antennas_position && state.antennas_position.length > 0) {
                return this._radToDeg(state.antennas_position[0]);
            }
            return 0;
        }

        /**
         * 右アンテナの角度を取得
         */
        async getAntennaRight() {
            const state = await this._getState();
            if (state && state.antennas_position && state.antennas_position.length > 1) {
                return this._radToDeg(state.antennas_position[1]);
            }
            return 0;
        }

        /**
         * 体のyaw角度を取得
         */
        async getBodyYaw() {
            const state = await this._getState();
            if (state && state.body_yaw !== undefined) {
                return this._radToDeg(state.body_yaw);
            }
            return 0;
        }

        // ==========================================
        // システム情報
        // ==========================================

        /**
         * daemon状態を取得
         */
        async getDaemonStatus() {
            try {
                const response = await fetch(`${API_BASE}/daemon/status`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                return data.status || 'unknown';
            } catch (error) {
                console.error('Get daemon status failed:', error);
                return 'error';
            }
        }

        // ==========================================
        // ユーティリティ関数
        // ==========================================

        _degToRad(degrees) {
            return degrees * Math.PI / 180;
        }

        _radToDeg(radians) {
            return radians * 180 / Math.PI;
        }
    }

    Scratch.extensions.register(new ReachyMiniExtension());
})(Scratch);
