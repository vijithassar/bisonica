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

svg();
canvas();
