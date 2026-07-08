(function () {
  if (sessionStorage.getItem('pageTransition') === 'forward') {
    document.documentElement.classList.add('from-page-transition')
  }
})()
