import template from './template.t';

export default template.define.text({
  content: ({ input }) => {
    return `name: ${input.name}`;
  }
});
