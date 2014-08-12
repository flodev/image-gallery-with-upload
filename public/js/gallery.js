

$(function () {
    'use strict';

    $('#fileupload').on('change', function() {
      console.log("hallo");
      $('.fileinput-button i.glyphicon-plus')
        .addClass('loading');
    });

    $.get(
        '/imagenames' + window.location.pathname
    ).done(function (data) {
        var linksContainer = $('#links'),
            imageName,
            smallImage;

        $('#title').text(data.folderName);

        for (smallImage in data.images) {
          imageName = data.images[smallImage];

          $('<a class="image-container"/>')
            .append(
              $('<img>').prop('src', "/photos" + window.location.pathname + '/' + smallImage)
            )
            .prop('href', "/photos" + window.location.pathname + '/' + imageName)
            .attr('data-gallery', '')
            .appendTo(linksContainer);
        }
        $('#blueimp-gallery').data('useBootstrapModal', false);
    });

    function upload($row) {
      if (!$row.length) {
        window.location.reload(true);
        return;
      }
      var data = $row.data('data');
      $('#fileupload').fileupload('send', data)
      .success(function() {
        $row.hide('slow', function() {
          $row.remove();
          upload($('#files .row').first());
        });
      });

      $row.find('.loading i').removeClass('hidden');
    };

    $('#upload').on('click', function() {
      var $row = $('#files .row').first();
      // disable upload btn
      $('#upload').prop('disabled', true);
      // start upload
      if ($row.length) {
        upload($row);
      }
    });

    var bootstrapColCss = 'col-xs-12 col-sm-4';

    $('#fileupload').fileupload({
        url: "/upload" + window.location.pathname,
        dataType: 'json',
        autoUpload: true,
        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        maxFileSize: 5000000, // 5 MB
        // Enable image resizing, except for Android and Opera,
        // which actually support image resizing, but fail to
        // send Blob objects via XHR requests:
        // disableImageResize: /Android(?!.*Chrome)|Opera/
        //     .test(window.navigator.userAgent),
        // previewMaxWidth: 100,
        // previewMaxHeight: 100,
        previewCrop: true,
        // disableImageLoad: true,
        disableVideoPreview: true
    }).on('fileuploadadd', function (e, data) {
        $('#fileupload')
          .prop('disabled', true);
        data.context = $('<div class="row"/>').appendTo('#files');

        $.each(data.files, function (index, file) {
            var node = $('<div class="' + bootstrapColCss + '">' + file.name + '</div>')
              .appendTo(data.context);
        });
        data.context.data('data', data);
    }).on('fileuploadprocessalways', function (e, data) {
        var index = data.index,
            file = data.files[index],
            parentRow = $(data.context.children()[index]).closest(".row"),
            node = $('<div class="' + bootstrapColCss + '"/>').appendTo(parentRow);

        if (file.preview) {
            node.append(file.preview);
        }

        if (file.error) {
            processImageRow(data);
            return;
        }

        // var btn = $('<button class="btn btn-success">Cancel</button>');
        // btn.data('data', data).on('click', function(e) {
        //   var btnData = $(e.currentTarget).data('data');
        //   btnData.context.hide('slow', function() {
        //     btnData.context.remove();
        //     btnData.abort();
        //   });
        // });
        // button row
        // $('<div class="' + bootstrapColCss + '"/>').appendTo(parentRow).append(btn);

        // loading row
        $('<div class="' + bootstrapColCss + ' loading"><i class="fa fa-cog"></i></div>').appendTo(parentRow);
    })
    .on('fileuploaddone', function(e, data) {
      processImageRow(data);
    })
    .on('fileuploadfail', function(e, data) {
      processImageRow(data);
    });

    function processImageRow(data) {
      data.context.hide('slow', (function(context) {
        return function() {
          context.remove();
          if (!$('#files .row').length) {
            $('#fileupload').prop('disabled', false);
            window.location.href = window.location.href;
          }
        };
      }(data.context)));
    };
});
