class AudioContext {
    createOscillator = () => null;
    createGain =  () => null;
}

const getBBox = () => {
    if (!window.SVGElement.prototype.getBBox) {
        window.SVGElement.prototype.getBBox = () => {
            return { height: 0, width: 0, x: 0, y: 0 };
        };
    }
};

const svg = () => {
    getBBox();
};

const url = () => {
    let counter = 0
    if (!window.URL?.createObjectURL) {
        window.URL.createObjectURL = () => {
            counter++
            return `https://test/${counter}`
        }
    }
}

const context = () => {
    const pixelsPerCharacter = 5;
    window.HTMLCanvasElement.prototype.getContext = () => {
        return {
            measureText: (text) => {
                return { width: text.length * pixelsPerCharacter };
            }
        };
    };
};

const canvas = () => {
    context();
};

const audio = () => {
    if (!window.AudioContext) {
        window.AudioContext = AudioContext;
    }
};

svg();
canvas();
audio();
url();
