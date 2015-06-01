var addonName = 'My Custom Stream';
var src = {};
src.public = {};
src.data = {};

// load static resources ajaxy (from same domain, so should be ok)
$.get('src/meta.json', function(data) {
    src.meta_json = data;
});
$.get('src/definition.json', function(data) {
    src.definition_json = data;
});

$.get('src/public/common.js', {}, function(data) {
    src.public.common_js = data;
}, 'text');
$.get('src/public/config-adaptor.js', {}, function(data) {
    src.public.config_adaptor_js = data;
}, 'text');
$.get('src/public/configuration.html', function(data) {
    src.public.configuration_html = data;
});
$.get('src/public/diagnostics.js', {}, function(data) {
    src.public.diagnostics_js = data;
}, 'text');
$.get('src/public/jive-ee.css', function(data) {
    src.public.jive_ee_css = data;
});
$.get('src/public/main.js', {}, function(data) {
    src.public.main_js = data;
}, 'text');
$.get('src/public/style.css', function(data) {
    src.public.style_css = data;
});

$.get('src/data/xform.js', function(data) {
    src.data.xform_js = data;
});

//encodeImage("sample-icon-128.png", function (dataURL) {
//    src.data.sample_icon_128_png = dataURL;
//    $(document).ready( function() {
//        $("#image_upload_preview").attr("src", dataURL);
//        resizeImage.call( $("#image_upload_preview")[0] );
//    });
//});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createZip() {
    var zip = new JSZip();

    var addonTitle = $('#addon_name').val();
    addonName = addonTitle || 'simple-tile-app';
    addonName = addonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    var addonDescription = $('#description').val() || 'A custom activity stream.';

    var _src = JSON.parse(JSON.stringify(src));
    var meta = _src.meta_json;
    var definition = _src.definition_json;

    var customHTMLsrc = $('#custom_html').val();
    var customHTML = customHTMLsrc && customHTMLsrc.length > 0 ? customHTMLsrc : '';

    var customCSSsrc = $('#custom_css').val();
    var customCSS = customCSSsrc && customCSSsrc.length > 0 ? '<style>' + customCSSsrc + '</style>' : '';

    var transformJSsrc = $('#xform_js').val();
    transformJSsrc = transformJSsrc ? transformJSsrc : _src.data.xform_js;

    console.log("Creating zip contents...");

    // Generate random UUID and put it in the meta JSON object
    meta["id"] = guid();

    var p16 = $("#image_upload_preview").attr("data-p16");
    var p48 = $("#image_upload_preview").attr("data-p48");
    var p128 = $("#image_upload_preview").attr("data-p128");
    zip.folder("data").file("icon-16.png", p16, { base64: true});
    zip.folder("data").file("icon-48.png", p48, { base64: true});
    zip.folder("data").file("icon-128.png", p128, { base64: true});

    traverse(_src, function(key, value, object) {
        if ( value && typeof value === 'string') {
            value = value.replace(/\$\$\$EXTENSION_UUID\$\$\$/g, meta["id"]);
            value = value.replace(/\$\$\$DISPLAY_NAME\$\$\$/g, addonTitle);
            value = value.replace(/\$\$\$INTERNAL_NAME\$\$\$/g, addonName);
            value = value.replace(/\$\$\$DESCRIPTION\$\$\$/g, addonDescription);
            value = value.replace(/\$\$\$CUSTOM_HTML\$\$\$/g, customHTML);
            value = value.replace(/\$\$\$CUSTOM_CSS\$\$\$/g, customCSS);
            object[key] = value;
        }
    });

    // Create meta and definition JSON files
    zip.file("definition.json", JSON.stringify(definition,null,4));
    zip.file("meta.json", JSON.stringify(meta,null,4));

    // public folder
    zip.folder("public").file("common.js", _src.public.common_js);
    zip.folder("public").file("config-adaptor.js", _src.public.config_adaptor_js);
    zip.folder("public").file("configuration.html", _src.public.configuration_html);
    zip.folder("public").file("diagnostics.js", _src.public.diagnostics_js);
    zip.folder("public").file("jive-ee.css", _src.public.jive_ee_css);
    zip.folder("public").file("main.js", _src.public.main_js);
    zip.folder("public").file("style.css", _src.public.style_css);

    // data folder
    zip.folder("data").file("xform.js", transformJSsrc);

    return zip;
}

var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();

function traverse(o,func) {
    for (var i in o) {
        func.apply(this,[i,o[i], o]);
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            traverse(o[i],func);
        }
    }
}

function encodeImage(imageUri, callback) {
    var c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    var img = new Image();
    img.onload = function () {
        c.width = this.width;
        c.height = this.height;
        ctx.drawImage(img, 0, 0);
        var dataURL = c.toDataURL("image/png");
        callback(dataURL)
    };
    img.src = imageUri;
}

function imageToDataUri(img, width, height) {

    // create an off-screen canvas
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
    ctx.drawImage(img, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL();
}

function base64ToDataUri(base64) {
    return 'data:image/png;base64,' + base64;
}

function resizeImage() {
    var p16 = imageToDataUri(this, 16, 16);
    var p48 = imageToDataUri(this, 48, 48);
    var p128 = imageToDataUri(this, 128, 128);

    $("#image_upload_preview").attr("data-p16", p16.split(',')[1]);
    $("#image_upload_preview").attr("data-p48", p48.split(',')[1]);
    $("#image_upload_preview").attr("data-p128", p128.split(',')[1]);
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var imgSrc = e.target.result;
            $('#image_upload_preview').attr('src', imgSrc).show();

            var img = new Image;

            img.onload = resizeImage;
            img.src =  $("#image_upload_preview").attr("src");

        };
        reader.readAsDataURL(input.files[0]);
    }
}

function bindEvent(el, eventName, eventHandler) {
    if (el.addEventListener){
        // standard way
        el.addEventListener(eventName, eventHandler, false);
    } else if (el.attachEvent){
        // old IE
        el.attachEvent('on'+eventName, eventHandler);
    }
}