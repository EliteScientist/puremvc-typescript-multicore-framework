import { IMediator, INotification, INotifier } from "../../interfaces";
import { Notifier } from "../observer";

/**
 * A base <code>IMediator</code> implementation. 
 * 
 * Typically, a <code>Mediator</code> will be written to serve one specific control or group
 * controls and so, will not have a need to be dynamically named.
 */
export class Mediator<ViewComponentType>
	extends Notifier
	implements IMediator, INotifier
{
	/**
	 * The name of the <code>Mediator</code>.
	 *
	 * @protected
	 */
	#mediatorName:string;

	/**
	 * The <code>Mediator</code>'s view component.
	 *
	 * @protected
	 */
	#viewComponent?: ViewComponentType;

	/**
	 * Constructs a <code>Mediator</code> instance.
	 *
	 * @param mediatorName
	 * 		The name of the <code>Mediator</code>.
	 *
	 * @param viewComponent
	 * 		The view component handled by this <code>Mediator</code>.
	 */
	constructor( mediatorName?:string, viewComponent?:ViewComponentType)
	{
		super();

		this.#mediatorName = mediatorName ?? Mediator.NAME;
		this.#viewComponent = viewComponent;	
	}

	/**
	 * Get the <code>Mediator</code> instance name.
	 *
	 * @return
	 * 		The <code>Mediator</code> instance name
	 */		
	public getMediatorName():string
	{	
		return this.#mediatorName;
	}

	/**
	 * Get the <code>Mediator</code>'s view component.
	 *
	 * Additionally, an implicit getter will usually be defined in the subclass that casts the
	 * view object to a type, like this:
	 * 
	 * <code>
	 *		getMenu():Menu
	 *		{
	 *			return <Menu> this.viewComponent;
	 *		}
	 * </code>
	 * 
	 * @return
	 * 		The <code>Mediator</code>'s default view component.
	 */
	public getViewComponent(): ViewComponentType | undefined
	{	
		return this.#viewComponent;
	}

	/**
	 * Set the <code>IMediator</code>'s view component.
	 * 
	 * @param viewComponent
	 * 		The default view component to set for this <code>Mediator</code>.
	 */
	public setViewComponent( viewComponent?:ViewComponentType ):void
	{
		this.#viewComponent = viewComponent;
	}

	/**
	 * List the <code>INotification</code> names this <code>IMediator</code> is interested in
	 * being notified of.
	 *
	 * @return
	 * 		The list of notifications names in which is interested the <code>Mediator</code>.
	 */
	public listNotificationInterests(): string[]
	{
		return [];
	}

	/**
	 * Handle <code>INotification</code>s.
	 * 
	 *
	 * Typically this will be handled in a switch statement, with one 'case' entry per
	 * <code>INotification</code> the <code>Mediator</code> is interested in.
	 *
	 * @param notification
	 * 		The notification instance to be handled.
	 */ 
	public async handleNotification( notification:INotification ): Promise<void>
	{

	}

	/**
	 * Called by the View when the Mediator is registered. This method has to be overridden
	 * by the subclass to know when the instance is registered.
	 */ 
	public onRegister():void
	{

	}

	/**
	 * Called by the View when the Mediator is removed. This method has to be overridden
	 * by the subclass to know when the instance is removed.
	 */ 
	public onRemove():void
	{

	}

	/**
	 * Default name of the <code>Mediator</code>.
	 *
	 * @constant
	 */
	static NAME:string = 'Mediator';
}