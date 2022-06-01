total_distance = 500; // 距离
sending_data_packets = []; // 传输中的数据分组
sending_confirm_packets = []; // 传输中的确认分组

key_counter = 0; // 用于标识唯一的分组，每创建一个该值加1

base = 0;
nextseq = 0;
expectedseq = 0;
send_buffer = 0;
cfm_buffer = 0;
rcv_buffer = 0;

pause_time = null; // 暂停开始时间，如果当前没暂停则为null
timeout = 5000; // 超时时间

default_speed = 300;

function set_run_speed(times) {
    distance /= times;
}


clocks = [];
clock = function (seq_num, timeout) {
    return {
        on: false,
        time: 0,
        seq_num: seq_num,
        start: function () {
            if (!this.on) this.on = true;
        },
        add: function (span) {
            if(!this.on) return;
            this.time += span;
            if (this.time > timeout) clock_timeout(this.seq_num);
        },
        restart: function () {
            this.time = 0;
        }
    }
};

function clock_timeout(seq_num) {
    clocks[seq_num].restart();
    send_data_packet(seq_num);
}

// 开始
function begin(num, size) {
    packetNum = num;
    windowSize = size;
    for(let i=0;i<num;i++){
        clocks.push(clock(i, timeout));
    }
}


// 暂停
function pause() {
    pause_time = new Date().getTime();
}


// 继续
function keep_on() {
    pause_time = null;
}


// 发送数据分组，开始计时
function send_data_packet(sequence_number) {
    if (sequence_number >= base + windowSize || sequence_number >= packetNum) {
        return;
    }
    let packet = {
        key_number: key_counter,
        sequence_number: sequence_number,
        data: true,
        position: 0,
        speed: default_speed
    };
    key_counter++;
    sending_data_packets.push(packet);
    if (sequence_number >= nextseq) {
        nextseq = sequence_number + 1;
    }
    clocks[sequence_number].start();
    send_buffer |= 1<<sequence_number;
}


// 发送确认分组
function send_confirm_packet(sequence_number) {
    let packet = {
        key_number: key_counter,
        sequence_number: sequence_number,
        data: false,
        position: 0,
        speed: default_speed
    };
    key_counter++;
    sending_confirm_packets.push(packet);
    send_buffer |= 1 << sequence_number;
}


// 接收方接收到数据分组
function data_packet_arrive(packet) {
    send_confirm_packet(packet.sequence_number);
    rcv_buffer |= 1 << packet.sequence_number;
    while((rcv_buffer & (1 << expectedseq))!=0){
        expectedseq++;
    }
}

// 发送方接收到确认分组
function confirm_packet_arrive(packet) {
    cfm_buffer |= (1 << packet.sequence_number);
    while ((cfm_buffer & (1 << base)) != 0) {
        base++;
    }
    clocks[packet.sequence_number].time = 0;
    clocks[packet.sequence_number].on = false;
}


// 删除确认分组
function delete_confirm_packet(key_number) {
    for (let i = 0; i < sending_confirm_packets.length; i++) {
        let packet = sending_confirm_packets[i];
        if (packet.key_number == key_number) {
            sending_confirm_packets.splice(i, 1);
            return;
        }
    }
}

// 删除数据分组
function delete_data_packet(key_number) {
    for (let i = 0; i < sending_data_packets.length; i++) {
        let packet = sending_data_packets[i];
        if (packet.key_number == key_number) {
            sending_data_packets.splice(i, 1);
            return;
        }
    }
}


// 设置分组速度
function set_speed(packet, speed) {
    packet.speed = speed;
}

last_update_time = null;
// 更新位置
function update_packet() {
    if (!last_update_time || pause_time) {
        last_update_time = new Date().getTime();
        return;
    }

    // 更新位置
    let now = new Date().getTime();
    let seconds = (now - last_update_time) / 1000;
    for (let i = 0; i < sending_data_packets.length; i++) {
        sending_data_packets[i].position += sending_data_packets[i].speed * seconds;
    }
    for (let i = 0; i < sending_confirm_packets.length; i++) {
        sending_confirm_packets[i].position += sending_confirm_packets[i].speed * seconds;
    }

    // 处理已到达的分组
    for (let i = 0; i < sending_data_packets.length; i++) {
        let packet = sending_data_packets[i];
        if (packet.position >= total_distance) {
            data_packet_arrive(packet);

            // 删除
            sending_data_packets.splice(i, 1);
            delete packet;
            i--;
        }
    }
    for (let i = 0; i < sending_confirm_packets.length; i++) {
        let packet = sending_confirm_packets[i];
        if (packet.position >= total_distance) {
            confirm_packet_arrive(packet);
            sending_confirm_packets.splice(i, 1);
            delete packet;
            i--;
        }
    }

    // 处理超时
    for (let i = 0; i < clocks.length; i++) {
        clocks[i].add(now - last_update_time);
    }

    last_update_time = now;
}

// 分组移动
function move_packet(packet) {
    let speed = speeds[packet.key_number];
    if (speed) {
        packet.position += speed;
    } else {
        packet.position += 500;
    }
}