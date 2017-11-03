$(document).ready(function () {
    var imgarr = [];
    imgarr.push('pexels-photo-76093.jpeg');
    imgarr.push('pexels-photo-326281.jpeg');
    imgarr.push('pexels-photo-461428.jpeg');
    imgarr.push('pexels-photo-568370.jpeg');
    imgarr.push('food-salad-healthy-vegetables.jpg');

     let index = Math.round(Math.random() * imgarr.length - 1);
    // 'url("../images/' + imgarr[index] + '")'
    if(index < 0){
        index = 0;
    }

     console.log(index);
     $('#showpage').css({
         'background-image' : 'url(../images/' + imgarr[index] + ')'
     });

     $('.header')
         .popup();


});