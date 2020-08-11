tinymce.init({
    selector: 'texNtarea.tinycme',
    menubar: false,
    height: 600,
    plugins: 'paste image link autolink lists table media',
    toolbar: [
        'undo redo | bold italic underline strikethrough | numlist bullist | alignleft aligncenter alignright',
        'forecolor backcolor',
        'table link image media',
        // 'paste'
    ],
    image_caption: true,
    entity_encoding: "raw",
});