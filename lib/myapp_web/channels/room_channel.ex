defmodule MyAppWeb.RoomChannel do
  use Phoenix.Channel, log_handle_in: false

  alias Phoenix.Socket.Broadcast

  alias MyAppWeb.Presence

  @impl true
  def join(room_id, _params, socket) do
    send(self(), :after_join)

    {
      :ok,
      %{},
      socket
      |> assign(user_id: System.unique_integer())
      |> assign(room_id: room_id)
      |> assign(color: RandomColor.rgb(lumonisty: :dark))
    }
  end

  @impl true
  def handle_in("message:add", %{"message" => message}, socket) do
    broadcast!(
      socket,
      "message:new",
      %{message: message, username: Map.get(socket.assigns, :username, "Guest"), color: socket.assigns.color}
    )

    {:reply, :ok, socket}
  end

  def handle_in("change:username", %{"username" => username}, socket) do
    Presence.update(socket, socket.assigns.user_id, %{username: username})

    push(socket, "presence_state", Presence.list(socket))

    {:reply, :ok, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    Presence.track(
      socket,
      socket.assigns.user_id,
      %{
        online_at: System.system_time(:second),
        username: Map.get(socket.assigns, :username, "Guest"),
        color: socket.assigns.color
      }
    )

    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end

  @impl true
  def handle_out("presence_diff", msg, socket) do
    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end
end