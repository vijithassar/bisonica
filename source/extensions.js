const extension = (s, key) => {
    if (s.usermeta?.[key]) {
        return s.usermeta[key];
    } else {
        throw new Error(`${key} is missing from specification.usermeta`);
    }
};

export { extension };
