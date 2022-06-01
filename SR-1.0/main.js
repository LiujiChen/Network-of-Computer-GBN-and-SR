packetNum = 25;
windowSize = 5;

begin(packetNum, windowSize);
init_canvas(packetNum);


function start() {
    setInterval(function () {
        update_packet();
        draw_scene();
    }, 20);
    document.getElementById("send").onclick = function(){
        send_data_packet(nextseq);
    };
}

start();