'use strict';

module.exports = {
  framework: 'qunit',
  test_page: './tests/index.html',
  launch_in_ci: ['Chrome'],
  launch_in_dev: ['Chrome'],
  tap_quiet_logs: true,
  src_files: [
    "source/**/*.js",
    "tests/**/*.js"
  ]
};