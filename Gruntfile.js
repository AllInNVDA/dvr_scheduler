module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var test_files = grunt.option('file') ;
  if(test_files== null || test_files.length < 1)
    test_files = "*";

  grunt.initConfig({    
    config: {            
    },
    open:{
      cov:{
        path: '.tmp/coverage/lcov-report/index.html'        
      }
    },    
    // execute: {      
    //   dev: {          
    //       src: ['server.js']
    //   },
    // }, 
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*'+test_files+'*.js']
      }      
    },
    mocha_istanbul: {
      coverage: {
        src: 'test', // the folder, not the files,
        options: {
          mask: '**/*'+test_files+'*.js',
          root: 'server',
          coverageFolder :'.tmp/coverage'
        }
      },
    },
    env: {
      test: {
        NODE_ENV: 'test'
      },
      dev: {
        NODE_ENV: 'development'
      }
    },
    // nodemon: {      
    //   script: 'server.js'      
    // }
  });
  grunt.registerTask('test', function() {
    return grunt.task.run([        
        'env:test',        
        'mochaTest'        
      ]);
  });  
  grunt.registerTask('cov', function() {
    return grunt.task.run([        
        'env:test',        
        'mocha_istanbul',
        'open:cov'        
      ]);
  });

  // grunt.registerTask('serve', function() {
  //   return grunt.task.run([        
  //       'env:dev',                
  //       'execute:dev'     
  //     ]);
  // });
};