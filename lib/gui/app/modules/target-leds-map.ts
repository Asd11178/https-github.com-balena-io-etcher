/*
 * Copyright 2019 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as _ from 'lodash';
import { RGBLed } from './leds';
const settings = require('../models/settings');

let ledTargetMap: LedTargetMap;

RGBLed.registerAnimation('breathe-white', (t: number) => {
	const intensity = Math.sin(t / 1000);
	return [intensity, intensity, intensity];
});

RGBLed.registerAnimation('blink-orange', (t: number) => {
	const intensity = Math.floor(t / 1000) % 2;
	return [intensity, intensity, 0];
});

RGBLed.registerAnimation('blink-purple', (t: number) => {
	const intensity = Math.floor(t / 1000) % 2;
	return [intensity, 0, intensity];
});

interface LedTargetMap {
	[key: string]: RGBLed;
}

export const getLedTargetMap = (): LedTargetMap => {
	if (!ledTargetMap) {
		const usbLedsMap = settings.get('usbLedsMap');
		ledTargetMap = _.mapValues(
			usbLedsMap,
			(pins: [number, number, number]) => new RGBLed(pins),
		);
	}
	return ledTargetMap;
};

export const getDriveLed = (devicePath: string) => {
	const sysPath: string = devicePath.replace('/dev/disk/by-path/', '');
	return getLedTargetMap()[sysPath];
};
