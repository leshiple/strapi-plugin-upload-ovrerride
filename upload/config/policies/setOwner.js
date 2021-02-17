module.exports = async (ctx, next) => {
  if (ctx.state.user) {
    ctx.request.body.owner = ctx.state.user.id;
    return await next();
  }
};
