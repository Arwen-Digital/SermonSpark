export default {
  routes: [
    {
      method: 'GET',
      path: '/sermons/mine',
      handler: 'sermon.mine',
      config: {
        auth: { strategies: ['users-permissions'] },
      },
    },
  ],
};

