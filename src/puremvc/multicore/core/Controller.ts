import { CommandConstructor, ICommand, IController, INotification, IView } from "../interfaces";
import { Observer } from "../patterns/observer";
import { View } from "./View";

/**
 * The <code>Controller</code> class for PureMVC.
 *
 * A multiton <code>IController</code> implementation.
 *
 * In PureMVC, the <code>Controller</code> class follows the 'Command and Controller' strategy,
 * and assumes these responsibilities:
 *
 * <UL>
 * <LI>Remembering which <code>ICommand</code>s are intended to handle which
 * <code>INotification</code>s.
 * <LI>Registering itself as an <code>IObserver</code> with the <code>View</code> for each
 * <code>INotification</code> that it has an <code>ICommand</code> mapping for.
 * <LI>Creating a new instance of the proper <code>ICommand</code> to handle a given
 * <code>INotification</code> when notified by the <code>View</code>.
 * <LI>Calling the <code>ICommand</code>'s <code>execute</code> method, passing in the
 * <code>INotification</code>.
 *
 * Your application must register <code>ICommand</code>s with the <code>Controller</code>.
 *
 * The simplest way is to subclass </code>Facade</code>, and use its
 * <code>initializeController</code> method to add your registrations.
 */
export class Controller
	implements IController
{
	/**
	 * Local reference to the <code>View</code> singleton.
	 *
	 * @protected
	 */		
	protected view?:IView;

	/**
	 * Mapping of <code>Notification<code> names to <code>Command</code> constructors references.
	 *
	 * @protected
	 */		
	protected commandMap:Map<string, CommandConstructor>;

	/**
	 * The multiton Key for this Core.
	 *
	 * @protected
	 */
	protected multitonKey:string;
	
	/**
	 * Constructs a <code>Controller</code> instance.
	 *
	 * This <code>IController</code> implementation is a multiton, so you should not call the
	 * constructor directly, but instead call the static multiton Factory method
	 * <code>Controller.getInstance( key )</code>.
	 * 
	 * @param key
	 *		Multiton key for this instance of <code>Controller</code>
		*
		* @throws Error
		* 		Throws an error if an instance for this multiton key has already been constructed.
		*/
	constructor( key:string )
	{
		if (Controller.instanceMap.has(key))
			throw Error( Controller.MULTITON_MSG );

		Controller.instanceMap.set(key, this);

		this.multitonKey = key;
		this.commandMap = new Map();
		this.initializeController();
	}

	/**
	 * Initialize the multiton <code>Controller</code> instance.
	 * 
	 * Called automatically by the constructor.
	 * 
	 * Note that if you are using a subclass of <code>View</code> in your application, you
	 * should <i>also</i> subclass <code>Controller</code> and override the
	 * <code>initializeController</code> method in the following way:
	 * 
	 * <pre>
	 *		// Ensure that the Controller is talking to my <code>IView</code> implementation.
		*		initializeController():void
		*		{
		*			this.view = MyView.getInstance( this.multitonKey );
		*		}
		* </pre>
		*
		* @protected
		*/
	protected initializeController():void
	{
		this.view = View.getInstance(this.multitonKey);
	}

	/**
	 * If an <code>ICommand</code> has previously been registered to handle the given
	 * <code>INotification</code>, then it is executed.
	 * 
	 * @param notification
	 * 		The <code>INotification</code> the command will receive as parameter.
	 */
	public async executeCommand( notification:INotification ): Promise<void>
	{
		/*
			* Typed any here instead of <code>Function</code> ( won't compile if set to Function
			* because today the compiler consider that <code>Function</code> is not newable and
			* doesn't have a <code>Class</code> type)
			*/
		const commandClass = this.commandMap.get(notification.getName());

		if (commandClass)
		{
			const command:ICommand = new commandClass();
			command.initializeNotifier( this.multitonKey );
			return command.execute(notification);
		}
	}

	/**
	 * Register a particular <code>ICommand</code> class as the handler for a particular
	 * <code>INotification</code>.
	 *
	 * If an <code>ICommand</code> has already been registered to handle
	 * <code>INotification</code>s with this name, it is no longer used, the new
	 * <code>ICommand</code> is used instead.
	 * 
	 * The <code>Observer</code> for the new <code>ICommand</code> is only created if this is
	 * the first time an <code>ICommand</code> has been registered for this
	 * <code>Notification</code> name.
	 * 
	 * @param notificationName
	 * 		The name of the <code>INotification</code>.
	 *
	 * @param commandClassRef
	 * 		The constructor of the <code>ICommand</code>.
	 */
	public registerCommand( notificationName:string, commandClass:CommandConstructor ):void
	{
		if( !this.commandMap.has(notificationName) )
			this.view?.registerObserver( notificationName, new Observer(this.executeCommand, this ) );

		this.commandMap.set(notificationName, commandClass);
	}

	/**
	 * Check if an <code>ICommand</code> is registered for a given <code>Notification</code>.
	 * 
	 * @param notificationName
	 * 		Name of the <code>Notification</code> to check wheter an <code>ICommand</code> is
	 * 		registered for.
	 *
	 * @return
	 * 		An <code>ICommand</code> is currently registered for the given
	 * 		<code>notificationName</code>.
	 */
	public hasCommand( notificationName:string ):boolean
	{
		return this.commandMap.has(notificationName);
	}

	/**
	 * Remove a previously registered <code>ICommand</code> to <code>INotification</code>
	 * mapping.
	 *
	 * @param notificationName
	 * 		The name of the <code>INotification</code> to remove the <code>ICommand</code>
	 * 		mapping for.
	 */
	public removeCommand( notificationName:string ):void
	{
		// if the Command is registered...
		if( this.hasCommand( notificationName ) )
		{
			this.view?.removeObserver( notificationName, this );			
			this.commandMap.delete(notificationName);
		}
	}


	/**
	 * Error message used to indicate that a <code>Controller</code> singleton instance is
	 * already constructed for this multiton key.
	 *
	 * @protected
	 * @constant
	 */
	static MULTITON_MSG:string = "Controller instance for this multiton key already constructed!";

	/**
	 * <code>Controller</code> singleton instance map.
	 *
	 * @protected
	 */
	static instanceMap:Map<string, IController> = new Map();

	/**
	 * <code>Controller</code> multiton factory method.
	 *
	 * @param key
	 *		The multiton key of the instance of <code>Controller</code> to create or retrieve.
		*
		* @return
		* 		The multiton instance of <code>Controller</code>
		*/
	static getInstance( key:string ): IController
	{
		if (!Controller.instanceMap.has(key))
			Controller.instanceMap.set(key, new Controller( key ));

		return Controller.instanceMap.get(key)!;
	}

	/**
	 * Remove a <code>Controller</code> instance.
	 * 
	 * @param key
	 *		Multiton key of the <code>Controller</code> instance to remove.
		*/
	static removeController( key:string ):void
	{
		Controller.instanceMap.delete(key);
	}
}
