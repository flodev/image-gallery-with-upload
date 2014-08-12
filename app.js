
var fs = require('fs'),
    express = require('express'),
    path = require('path'),
    // bodyParser = require('body-parser'),
    gm = require('gm'),
    Busboy = require('busboy'),
    bodyParser,
    logError,
    folders = JSON.parse(fs.readFileSync('folders.json').toString("utf-8")),
    app = express(),
    getFoldersWithStatus = function() {
      var folderName,
          statusFolders = {},
          photoFolder = "public/photos",
          isEmpty = function(folderName) {
            var folderPath = path.join(photoFolder, folderName);
            if (!fs.existsSync(folderPath)) {
              return true;
            }
            return fs.readdirSync(folderPath).length == 0;
          };
      for (folderName in folders) {
        statusFolders[folderName] = {
          title: folders[folderName],
          isEmpty: isEmpty(folderName)
        };
      }
      return statusFolders;
    };

logError = function(err) {
  return console.log(_.isObject(err) ? err.stack : err);
};

app.use(express.static('public'));


// app.use(bodyParser.json());
//
// app.use(bodyParser.urlencoded({
//   extended: true,
//   uploadDir: "/tmp"
// }));


/*
error handling
 */

app.use(function(err, req, res, next) {
  logError(err);
  return res.send(500, 'Something broke!');
});


/*
default
 */

app.get('/', function(req, res) {
  fs.readFile('public/folders.html', function(err, data) {
    res.send(data.toString("utf-8"));
  });
});

/*
gallery
*/

(function() {
  var folder,
      folderFunction = function(req, res) {
        fs.readFile('public/gallery.html', function(err, data) {
          res.send(data.toString("utf-8"));
        });
      };

  for (folder in folders) {
    app.get('/' + folder, folderFunction);
  }
}());

/*
folders
*/

app.get('/folders.json', function(req, res) {
  res.send(getFoldersWithStatus());
});

/*
pictures
*/
app.get('/imagenames/*', function(req, res) {
  var photoFolderName = req.url.replace("/imagenames/", "").replace('/', "");
  if (!folders[photoFolderName]) {
    return res.send(500, "unknown image folder name: " + photoFolderName);
  }
  fs.readdir("public/photos/" + photoFolderName, function(err, files) {
    var filenames = {}, i, filename, filenameWithoutExtension;

    for (i in files) {
      filename = files[i];
      // skip small size images to avoid duplication
      if (filename.indexOf("_s.png") != -1) {
        continue;
      }
      // make sure only image files are shown
      if (!filename.match(/(\.|\/)(gif|jpe?g|png)$/i)) {
        continue;
      }
      filenameWithoutExtension = filename.replace(path.extname(filename), "");
      filenames[filenameWithoutExtension + '_s.png'] = filename;
    }

    res.send({images: filenames, folderName: folders[photoFolderName]});
  });
});

/*
upload
*/

app.post("/upload/*", function(req, res) {
    console.log("start processing file upload");
    var photoFolderName = req.url.replace("/upload/", "").replace('/', "");
    if (!folders[photoFolderName]) {
      return res.send(500, "unknown image folder name: " + photoFolderName);
    }
    var busboy = new Busboy({ headers: req.headers }),
        dir = "public/photos/" + photoFolderName;

    // make sure folder exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    var filename,
        filenameWithoutExtension,
        extension;

    busboy.on('file', function(fieldname, file, name, encoding, mimetype) {
      filename = name;
      extension = path.extname(filename);
      filenameWithoutExtension = filename.replace(extension, "");

      if (!extension.match(/(\.|\/)(gif|jpe?g|png)$/i).length) {
        console.log("unknown file type");
        res.status(500);
        return res.send("error");
      }
      // append random string to filename
      filenameWithoutExtension = filenameWithoutExtension + "_" + Math.random().toString(36).substring(7);
      filename = filenameWithoutExtension + extension;
      var saveTo = path.join(dir, filename);
      file.pipe(fs.createWriteStream(saveTo));
    });



    busboy.on('finish', function() {
      gm(path.join(dir, filename + (extension.toLowerCase() == '.gif' ? '[0]' : '')))
        .options({imageMagick: true})
        .resize(240, 240)
        .autoOrient()
        .noProfile()
        .write(path.join(dir, filenameWithoutExtension + "_s.png"), function (err) {

          if (!err) {
            res.status(200);
            return res.send({});
          } else {
            console.log("cannot write image");
            res.status(500);
            return res.send("error");
          }
        });
    });
    req.pipe(busboy);
});



/*
default
 */
app.use(function(req, res, next) {
  res.status(404);
  return res.send({
    error: 'Not found'
  });
});

app.listen(3002);
