const extension = (s, key) => {
    if (s.usermeta?.[key]) {
        return s.usermeta[key];
    }
};

export { extension };
