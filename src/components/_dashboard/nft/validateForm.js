export const validateForm = (values) => {
  let error = false;
  console.log(values);
  values.map((val) => {
    if (!val.traitName || !val.imagArr.length) {
      error = true;
      return val;
    }
    if (val.imagArr.length) {
      val.imagArr.map((x) => {
        if (!x.traitRar || !x.traitVal) {
          error = true;
        }
        return x;
      });
    }
    return val;
  });
  return error;
};
