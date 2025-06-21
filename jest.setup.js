import { jest } from '@jest/globals';

jest.useFakeTimers();

jest.mock('react-native-vector-Icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-qrcode-svg', () => 'QRCODE');
jest.mock('react-native-qrcode-scanner', () => 'QRCODE_SCANNER');
jest.mock('react-native-image-picker', () => 'IMAGE_PICKER');
