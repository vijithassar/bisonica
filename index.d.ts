export interface Chart {
    (s: object, dimensions?: {x: number, y: number});
    tooltip(handler: function): function | void;
    error(handler: function): function | void;
    table(handler: function): function | void;
}
