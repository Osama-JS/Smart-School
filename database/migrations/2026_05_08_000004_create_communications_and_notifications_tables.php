<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. غرف الدردشة (Chat Rooms)
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable(); // قد يكون اسم المعلم مع ولي الأمر
            $table->enum('type', ['private', 'group'])->default('private');
            $table->timestamps();
        });

        // 2. أعضاء غرف الدردشة
        Schema::create('chat_room_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. الرسائل (Messages)
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('message_text')->nullable();
            $table->string('attachment_url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // 4. الإشعارات (Push Notifications)
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type'); // (academic, financial, behavior)
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_room_user');
        Schema::dropIfExists('chat_rooms');
    }
};
